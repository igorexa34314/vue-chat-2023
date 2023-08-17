import { getUid } from '@/services/auth';
import {
	getFirestore,
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
import { getUserRef, getUserdataById } from '@/services/user';
import { fbErrorHandler as errorHandler } from '@/services/errorHandler';
import { UserData, UserInfo } from '@/types/db/UserdataTable';
import { ChatInfo as DBChatTable } from '@/types/db/ChatTable';

export interface ChatInfo extends Omit<DBChatTable, 'members'> {
	members: Pick<UserInfo, 'uid' | 'displayName' | 'photoURL'>[];
}

export const chatCol = collection(getFirestore(), 'chats');

const isPrivateChatExists = async (u1: UserInfo['uid'], u2: UserInfo['uid']): Promise<ChatInfo['id'] | undefined> => {
	let chatId: ChatInfo['id'] | undefined;
	const q = query(chatCol, where('members', 'array-contains', u1), where('type', '==', 'private'));
	const querySnapshot = await getDocs(q);
	querySnapshot.forEach(doc => {
		if ((doc.data().members as string[]).includes(u2)) {
			chatId = doc.id;
		}
	});
	return chatId;
};

const createPrivateChat = async (...users: UserInfo['uid'][]): Promise<ChatInfo['id'] | undefined> => {
	try {
		const newChatRef = doc(chatCol);
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
					await updateDoc(getUserRef(el), {
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
};

export const createSelfChat = async (uid: UserInfo['uid']): Promise<ChatInfo['id'] | undefined> => {
	try {
		const newChatRef = doc(chatCol);
		await setDoc(newChatRef, {
			id: newChatRef.id,
			name: 'Saved messages',
			type: 'self',
			members: [uid],
			created_at: Timestamp.fromDate(new Date()),
		});
		await updateDoc(getUserRef(uid), {
			chats: arrayUnion(newChatRef.id),
		});
		return newChatRef.id;
	} catch (e) {
		errorHandler(e);
	}
};

export const joinPrivateChat = async (companionId: UserInfo['uid']): Promise<ChatInfo['id'] | undefined> => {
	try {
		const senderId = (await getUid()) as UserInfo['uid'];
		return (await isPrivateChatExists(senderId, companionId)) || (await createPrivateChat(senderId, companionId));
	} catch (e) {
		errorHandler(e);
	}
};

export const getChatInfoById = async (chatId: ChatInfo['id']): Promise<ChatInfo | undefined> => {
	try {
		const chat = await getDoc(doc(chatCol, chatId));
		if (chat.exists()) {
			const { members, ...data } = chat.data() as ChatInfo;
			const membersInfo = <ChatInfo['members']>(await Promise.all(chat.data().members.map(getUserdataById))).map(
				(m: UserData) => ({
					uid: m.info.uid,
					displayName: m.info.displayName,
					photoURL: m.info.photoURL,
				})
			);
			return {
				...data,
				members: membersInfo,
				created_at: chat.data().created_at.toDate(),
			} as ChatInfo;
		}
	} catch (e) {
		errorHandler(e);
	}
};
