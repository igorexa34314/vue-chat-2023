import { AuthService } from '@/services/auth';
import { db } from '@/firebase';
import {
	collection,
	doc,
	setDoc,
	updateDoc,
	arrayUnion,
	query,
	where,
	getDoc,
	getDocs,
	Timestamp,
} from 'firebase/firestore';
import { UserService } from '@/services/user';
import { fbErrorHandler as errorHandler } from '@/utils/errorHandler';
import { UserData, UserInfo } from '@/types/db/UserdataTable';
import { ChatInfo as DBChatTable } from '@/types/db/ChatTable';

export interface ChatInfo extends Omit<DBChatTable, 'members'> {
	members: Pick<UserInfo, 'uid' | 'displayName' | 'photoURL'>[];
}

export class ChatService {
	static chatCol = collection(db, 'chats');

	static async isPrivateChatExists(u1: UserInfo['uid'], u2: UserInfo['uid']): Promise<ChatInfo['id'] | undefined> {
		let chatId: ChatInfo['id'] | undefined;
		const q = query(ChatService.chatCol, where('members', 'array-contains', u1), where('type', '==', 'private'));
		const querySnapshot = await getDocs(q);
		querySnapshot.forEach(doc => {
			if ((doc.data().members as string[]).includes(u2)) {
				chatId = doc.id;
			}
		});
		return chatId;
	}

	static async createPrivateChat(...users: UserInfo['uid'][]): Promise<ChatInfo['id'] | undefined> {
		try {
			const newChatRef = doc(ChatService.chatCol);
			const chatInfo = {
				id: newChatRef.id,
				name: 'Private chat',
				type: 'private',
				members: users,
				created_at: Timestamp.fromDate(new Date()),
			};
			await setDoc(newChatRef, chatInfo);
			const promises = [] as Array<Promise<void>>;
			users.forEach(el => {
				promises.push(
					(async () => {
						await updateDoc(UserService.getUserRef(el), {
							chats: arrayUnion(newChatRef.id),
						});
					})()
				);
			});
			await Promise.all(promises);
			return newChatRef.id;
		} catch (e) {
			errorHandler(e);
		}
	}

	static async createSelfChat(uid: UserInfo['uid']): Promise<ChatInfo['id'] | undefined> {
		try {
			const newChatRef = doc(ChatService.chatCol);
			await setDoc(newChatRef, {
				id: newChatRef.id,
				name: 'Saved messages',
				type: 'self',
				members: [uid],
				created_at: Timestamp.fromDate(new Date()),
			});
			await updateDoc(UserService.getUserRef(uid), {
				chats: arrayUnion(newChatRef.id),
			});
			return newChatRef.id;
		} catch (e) {
			errorHandler(e);
		}
	}

	static async joinPrivateChat(companionId: UserInfo['uid']): Promise<ChatInfo['id'] | undefined> {
		try {
			const senderId = (await AuthService.getUid()) as UserInfo['uid'];
			return (
				(await ChatService.isPrivateChatExists(senderId, companionId)) ||
				(await ChatService.createPrivateChat(senderId, companionId))
			);
		} catch (e) {
			errorHandler(e);
		}
	}

	static async getChatInfoById(chatId: ChatInfo['id']): Promise<ChatInfo | undefined> {
		try {
			const chat = await getDoc(doc(ChatService.chatCol, chatId));
			if (chat.exists()) {
				const { members, ...data } = chat.data() as ChatInfo;
				const membersInfo = <ChatInfo['members']>(
					await Promise.all(chat.data().members.map(UserService.getUserdataById))
				).map((m: UserData) => ({
					uid: m.info.uid,
					displayName: m.info.displayName,
					photoURL: m.info.photoURL,
				}));
				return {
					...data,
					members: membersInfo,
					created_at: chat.data().created_at.toDate(),
				} as ChatInfo;
			}
		} catch (e) {
			errorHandler(e);
		}
	}
}
