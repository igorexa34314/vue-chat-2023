import { db, functions } from '@/firebase';
import { timestampConverter } from '@/utils/firestore';
import {
	DocumentReference,
	collection,
	doc,
	getDoc,
	FirestoreDataConverter,
	QueryDocumentSnapshot,
	CollectionReference,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { UserService, DisplayUserInfo } from '@/services/user';
import { fbErrorHandler as errorHandler } from '@/utils/errorHandler';
import { ParsedTimestamps } from '@/types/db/helpers';
import { ChatInfo as DBChat, ChatType } from '@/types/db/ChatTable';
import { User } from 'firebase/auth';

type ChatWithId = ParsedTimestamps<DBChat> & { id: DocumentReference['id'] };

export interface ChatInfo<T extends ChatType = ChatType> extends Omit<ChatWithId, 'members' | 'created_by'> {
	created_by: DisplayUserInfo;
	members: [T] extends ['saved'] ? never : DisplayUserInfo[];
}

export class ChatService {
	private static chatConverter: FirestoreDataConverter<ChatWithId, DBChat> = {
		toFirestore: ({ id, ...chatInfo }) => timestampConverter().toFirestore(chatInfo) as DBChat,
		fromFirestore: (snapshot: QueryDocumentSnapshot<ChatWithId, DBChat>, options) => {
			const chat = timestampConverter<DBChat>().fromFirestore(snapshot, options);
			return { ...chat, id: snapshot.ref.id } as ChatWithId;
		},
	};

	static chatCol = collection(db, 'chats') as CollectionReference<DBChat>;

	private static getChatDocRef(chatId: ChatInfo['id']) {
		return doc(ChatService.chatCol, chatId).withConverter(this.chatConverter);
	}

	static async joinPrivateChat(companionId: User['uid']): Promise<ChatInfo['id']> {
		try {
			const joinPrivateChatByCompanionId = httpsCallable<
				{ companionId: string },
				{
					exists: boolean;
					chatId: string;
				}
			>(functions, 'joinPrivateChatByCompanionId');

			const res = await joinPrivateChatByCompanionId({ companionId });
			return res.data.chatId;
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async getChatInfoByRef(chatDocRef: DocumentReference<DBChat> | DocumentReference<ChatWithId>) {
		try {
			const chat = await getDoc(chatDocRef.withConverter(this.chatConverter));
			if (chat.exists()) {
				const chatData = chat.data();
				const creatorInfo = (await UserService.getUserDisplayInfo(chatData.created_by.id))!;
				if (chatData.type !== 'saved' && chatData.members?.length) {
					const membersInfo = await Promise.all(
						chatData.members.map(async m => (await UserService.getUserDisplayInfo(m.id))!)
					);
					return { ...chatData, created_by: creatorInfo, members: membersInfo } as ChatInfo;
				}
				return { ...chatData, created_by: creatorInfo } as ChatInfo<'saved'>;
			}
			return null;
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async getChatInfoById(chatId: ChatInfo['id']) {
		return ChatService.getChatInfoByRef(ChatService.getChatDocRef(chatId));
	}

	static async getUserChatsInfo(...chatDocsRefs: DocumentReference<DBChat>[]) {
		return Promise.all(
			chatDocsRefs.map(doc => ChatService.getChatInfoByRef(doc.withConverter(this.chatConverter)))
		).then(chats => chats.filter(Boolean) as ChatInfo[]);
	}
}
