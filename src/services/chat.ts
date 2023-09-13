import { db, functions } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { UserService } from '@/services/user';
import { fbErrorHandler as errorHandler } from '@/utils/errorHandler';
import { UserData, UserInfo } from '@/types/db/UserdataTable';
import { ChatInfo as DBChatTable, ChatType } from '@/types/db/ChatTable';

export interface ChatInfo<T extends ChatType = ChatType> extends Omit<DBChatTable, 'members'> {
	members: T extends 'saved' ? never : Pick<UserInfo, 'uid' | 'displayName' | 'photoURL'>[];
}

export class ChatService {
	static chatCol = collection(db, 'chats');

	static async joinPrivateChat(companionId: UserInfo['uid']): Promise<ChatInfo['id'] | undefined> {
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

	static async getChatInfoById(chatId: ChatInfo['id']): Promise<ChatInfo | undefined> {
		try {
			const chat = await getDoc(doc(ChatService.chatCol, chatId));
			if (chat.exists()) {
				const { members, ...chatData } = chat.data() as ChatInfo;
				if (chatData.type !== 'saved' && members?.length) {
					const membersInfo = <ChatInfo['members']>(
						await Promise.all(chat.data().members.map(UserService.getUserdataById))
					).map((m: UserData) => ({
						uid: m.info.uid,
						displayName: m.info.displayName,
						photoURL: m.info.photoURL,
					}));
					return {
						...chatData,
						members: membersInfo,
						created_at: chat.data().created_at.toDate(),
					} as ChatInfo;
				}
				return {
					...chatData,
					created_at: chat.data().created_at.toDate(),
				} as ChatInfo;
			}
		} catch (e) {
			return errorHandler(e);
		}
	}
}
