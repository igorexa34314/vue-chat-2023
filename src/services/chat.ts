import { db, functions } from '@/firebase';
import { CollectionReference, collection, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { UserService, PublicUserInfo } from '@/services/user';
import { fbErrorHandler as errorHandler } from '@/utils/errorHandler';
import { UserInfo as DBUserInfo } from '@/types/db/UserdataTable';
import { ParsedTimestamps } from '@/types/db/helpers';
import { ChatInfo as DBChatTable, ChatType } from '@/types/db/ChatTable';

export interface ChatInfo<T extends ChatType = ChatType> extends Omit<ParsedTimestamps<DBChatTable>, 'members'> {
	members: T extends 'saved' ? never : PublicUserInfo[];
}

export class ChatService {
	static chatCol = collection(db, 'chats') as CollectionReference<DBChatTable>;

	static async joinPrivateChat(companionId: DBUserInfo['uid']): Promise<ChatInfo['id']> {
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

	static async getChatInfoById(chatId: DBChatTable['id']): Promise<ChatInfo | null> {
		try {
			let chatInfo: ChatInfo | null = null;
			const chat = await getDoc(doc(ChatService.chatCol, chatId));
			if (chat.exists()) {
				const { members, created_at, updated_at, ...chatData } = chat.data();
				chatInfo = {
					...chatData,
					created_at: created_at.toDate(),
					updated_at: updated_at?.toDate() ?? null,
				} as ChatInfo<'saved'>;
				if (chatData.type !== 'saved' && members?.length) {
					const membersInfo = await UserService.getUsersbyIds(...members);
					chatInfo.members = membersInfo;
				}
			}
			return chatInfo;
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async getUserChatsInfo(...chatIds: string[]) {
		return Promise.all(chatIds.map(ChatService.getChatInfoById)).then(chats => chats.filter(Boolean) as ChatInfo[]);
	}
}
