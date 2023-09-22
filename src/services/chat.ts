import { db, functions } from '@/firebase';
import {
	DocumentReference,
	collection,
	doc,
	getDoc,
	FirestoreDataConverter,
	QueryDocumentSnapshot,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { UserService, PublicUserInfo, UserInfo, UserData } from '@/services/user';
import { fbErrorHandler as errorHandler } from '@/utils/errorHandler';
import { ParsedTimestamps } from '@/types/db/helpers';
import { ChatInfo as DBChat, ChatType } from '@/types/db/ChatTable';
import { timestampToDate } from '@/utils/helpers';
import { User } from 'firebase/auth';

type ConvertedChat = ParsedTimestamps<DBChat> & { id: DocumentReference['id'] };

export interface ChatInfo<T extends ChatType = ChatType> extends Omit<ConvertedChat, 'members'> {
	members: T extends 'saved' ? never : PublicUserInfo[];
}

export class ChatService {
	private static chatConverter: FirestoreDataConverter<ConvertedChat, DBChat> = {
		toFirestore: chat => {
			const { id, ...chatInfo } = chat;
			return chatInfo as DBChat;
		},
		fromFirestore: (snapshot: QueryDocumentSnapshot<DBChat>, options) => {
			const { created_at, updated_at, ...chatInfo } = snapshot.data(options);
			return {
				...chatInfo,
				...timestampToDate({ created_at, updated_at }),
				id: snapshot.ref.id,
			} as ConvertedChat;
		},
	};

	static chatCol = collection(db, 'chats').withConverter(this.chatConverter);

	private static getChatDocRef(chatId: ChatInfo['id']) {
		return doc(ChatService.chatCol, chatId);
	}

	static async joinPrivateChat(companionId: User['uid']): Promise<ChatInfo['id']> {
		try {
			const joinPrivateChatByCompanionId = httpsCallable<{ companionId: string }, { chatId: string }>(
				functions,
				'joinPrivateChatByCompanionId'
			);

			const res = await joinPrivateChatByCompanionId({ companionId });
			return res.data.chatId;
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async getChatInfoByRef(chatDocRef: DocumentReference<ConvertedChat, DBChat>) {
		try {
			let chatInfo: ChatInfo | null = null;
			const chat = await getDoc(chatDocRef);
			if (chat.exists()) {
				const { members, ...chatData } = chat.data();
				chatInfo = chatData as ChatInfo<'saved'>;
				if (chatData.type !== 'saved' && members?.length) {
					const membersInfo = await UserService.getUsersbyIds(...members.map(doc => doc.id));
					chatInfo.members = membersInfo;
				}
			}
			return chatInfo;
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async getChatInfoById(chatId: ChatInfo['id']) {
		return ChatService.getChatInfoByRef(ChatService.getChatDocRef(chatId));
	}

	static async getUserChatsInfo(...chatDocsRefs: UserData['chats']) {
		return Promise.all(
			chatDocsRefs.map(doc => ChatService.getChatInfoByRef(doc.withConverter(this.chatConverter)))
		).then(chats => chats.filter(Boolean) as ChatInfo[]);
	}
}
