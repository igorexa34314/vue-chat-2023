import { useAuth } from '@/composables/auth';
import { useUserdataStore } from '@/stores/userdata';
import { FirebaseError } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, updateDoc, arrayUnion, query, where, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import { UserInfo } from '@/stores/userdata';

type ChatType = 'self' | 'private' | 'group';
export interface ChatInfo<MembersType = UserInfo['uid']> {
	id: string;
	name: string;
	avatar?: string;
	type: ChatType;
	created_at: Date;
	members: MembersType[];
}

export const useChat = () => {
	const { getUid } = useAuth();
	const userdataStore = useUserdataStore();
	const db = getFirestore();
	const chatCol = collection(db, 'chat');

	const isPrivateChatExists = async (u1: UserInfo['uid'], u2: UserInfo['uid']): Promise<ChatInfo['id'] | undefined> => {
		let chatId;
		const q = query(chatCol, where('type', '==', 'private'), where('members', '==', [u1, u2]));
		const querySnapshot = await getDocs(q);
		querySnapshot.forEach(doc => {
			chatId = doc.id;
		});
		return chatId;
	};
	const createSelfChat = async (uid: UserInfo['uid']): Promise<ChatInfo['id']> => {
		try {
			const newChatRef = doc(chatCol);
			await setDoc(newChatRef, { id: newChatRef.id, name: 'Saved messages', type: 'self', members: [uid], created_at: Timestamp.fromDate(new Date()) });
			await updateDoc(userdataStore.getUserRef(uid), {
				chats: arrayUnion(newChatRef.id)
			});
			return newChatRef.id;
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const createPrivateChat = async (...users: Array<UserInfo['uid']>): Promise<ChatInfo['id']> => {
		try {
			const newChatRef = doc(chatCol);
			const chatInfo = { id: newChatRef.id, name: 'Private chat', type: 'private', members: users, created_at: Timestamp.fromDate(new Date()) };
			await setDoc(newChatRef, chatInfo);
			const promises = [] as Array<Promise<void>>;
			users.forEach(el => {
				promises.push(
					(async () => {
						await updateDoc(userdataStore.getUserRef(el), {
							chats: arrayUnion(newChatRef.id)
						});
					})()
				);
			});
			await Promise.all(promises);
			return newChatRef.id;
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const joinPrivateChat = async (companionId: UserInfo['uid']): Promise<ChatInfo['id']> => {
		try {
			const senderId = (await getUid()) as UserInfo['uid'];
			return (await isPrivateChatExists(senderId, companionId)) || (await createPrivateChat(senderId, companionId));
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const getChatInfoById = async (chatId: ChatInfo['id']): Promise<ChatInfo<UserInfo> | undefined> => {
		try {
			const chat = await getDoc(doc(chatCol, chatId));
			if (chat.exists()) {
				const { members, ...data } = chat.data() as ChatInfo;
				const membersInfo = (await Promise.all(chat.data().members.map(userdataStore.getUserdataById))).map(m => m.info);
				return {
					...data,
					members: membersInfo,
					created_at: chat.data().created_at.toDate()
				} as ChatInfo<UserInfo>;
			}
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	return {
		createSelfChat,
		joinPrivateChat,
		getChatInfoById
	};
};
