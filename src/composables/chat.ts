import { computed } from 'vue';
import { useAuth } from '@/composables/auth';
import { useUserdataStore } from '@/stores/userdata';
import { FirebaseError } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, updateDoc, arrayUnion, query, where, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import type { UserData, UserInfo } from '@/types/db/UserdataTable';
import type { ChatInfo as DBChatTable } from '@/types/db/ChatTable';

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;
const savedMessages = new URL('@/assets/img/saved-messages.png', import.meta.url).href;

export interface ChatInfo extends Omit<DBChatTable, 'members'> {
	members: Pick<UserInfo, 'uid' | 'displayName' | 'photoURL'>[];
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
	const createPrivateChat = async (...users: UserInfo['uid'][]): Promise<ChatInfo['id']> => {
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
	const getChatInfoById = async (chatId: ChatInfo['id']): Promise<ChatInfo | undefined> => {
		try {
			const chat = await getDoc(doc(chatCol, chatId));
			if (chat.exists()) {
				const { members, ...data } = chat.data() as ChatInfo;
				const membersInfo = <ChatInfo['members']>(
					(await Promise.all(chat.data().members.map(userdataStore.getUserdataById))).map((m: UserData) => ({
						uid: m.info.uid,
						displayName: m.info.displayName,
						photoURL: m.info.photoURL
					}))
				);
				return {
					...data,
					members: membersInfo,
					created_at: chat.data().created_at.toDate()
				} as ChatInfo;
			}
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};

	const setChatName = computed(() => (chat: ChatInfo) => {
		return chat.type === 'self'
			? 'Saved messages'
			: chat.type === 'private'
			? (chat.members.find(m => m.uid !== userdataStore.userdata?.info?.uid)?.displayName as string)
			: chat.name;
	});
	const setChatAvatar = computed(() => (chat: ChatInfo) => {
		return chat.type === 'private'
			? (chat.members.find(m => m.uid !== userdataStore.userdata?.info?.uid)?.photoURL as string)
			: chat.type === 'self'
			? savedMessages
			: defaultAvatar;
	});

	return {
		createSelfChat,
		joinPrivateChat,
		getChatInfoById,
		setChatName,
		setChatAvatar
	};
};
