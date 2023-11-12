import { db, functions } from '@/firebase';
import { withIdConverter } from '@/utils/firestore';
import {
	DocumentReference,
	collection,
	doc,
	getDoc,
	CollectionReference,
	query,
	where,
	getDocs,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { UserService, type DisplayUserInfo } from '@/services/user';
import { fbErrorHandler as errorHandler } from '@/utils/errorHandler';
import type { ChatInfo as DBChat, ChatType } from '@/types/db/ChatTable';

type ConvertedChat = ReturnType<ReturnType<typeof withIdConverter<DBChat>>['fromFirestore']>;

export interface ChatInfo<T extends ChatType = ChatType> extends Omit<ConvertedChat, 'members' | 'created_by'> {
	created_by: DisplayUserInfo;
	members: [T] extends ['saved'] ? never : DisplayUserInfo[];
}

export class ChatService {
	static chatCol = collection(db, 'chats') as CollectionReference<DBChat>;

	private static getChatDocRef(chatId: ChatInfo['id']) {
		return doc(ChatService.chatCol, chatId).withConverter(withIdConverter<DBChat>());
	}

	static async joinPrivateChat(companionId: DocumentReference['id']): Promise<ChatInfo['id']> {
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

	static async getChatInfoByRef(chatDocRef: DocumentReference<DBChat> | DocumentReference<ConvertedChat>) {
		try {
			const chat = await getDoc(chatDocRef.withConverter(withIdConverter<DBChat>()));
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

	static async getUserChatsInfoByRef(...chatRefs: DocumentReference<DBChat>[] | DocumentReference<ConvertedChat>[]) {
		try {
			const chatsSnap = await getDocs(
				query(this.chatCol.withConverter(withIdConverter<DBChat>()), where('__name__', 'in', chatRefs))
			);
			const userChats = await Promise.all(
				chatsSnap.docs.map(async doc => {
					const chatData = doc.data();
					const creatorInfo = (await UserService.getUserDisplayInfo(chatData.created_by.id))!;
					if (chatData.type !== 'saved' && chatData.members?.length) {
						const membersInfo = await Promise.all(
							chatData.members.map(async m => (await UserService.getUserDisplayInfo(m.id))!)
						);
						return { ...chatData, created_by: creatorInfo, members: membersInfo } as ChatInfo;
					}
					return { ...chatData, created_by: creatorInfo } as ChatInfo<'saved'>;
				})
			);
			return userChats;
		} catch (e) {
			return errorHandler(e);
		}
	}
}
