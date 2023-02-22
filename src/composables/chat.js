import { useAuth } from '@/composables/auth';
import { useUserdataStore } from '@/stores/userdata';
import { getFirestore, collection, doc, setDoc, updateDoc, arrayUnion, query, where, getDoc, getDocs, Timestamp } from 'firebase/firestore';

export const useChat = () => {
	const { getUid } = useAuth();
	const { getUserRef, getUserdataById } = useUserdataStore();
	const db = getFirestore();
	const chatCol = collection(db, 'chat');

	const isPrivateChatExists = async (u1, u2) => {
		let chatId;
		const q = query(chatCol, where('type', '==', 'private'), where('members', '==', [u1, u2]));
		const querySnapshot = await getDocs(q);
		querySnapshot.forEach(doc => {
			return (chatId = doc.id);
		});
		return chatId;
	};
	const createPrivateChat = async (...users) => {
		try {
			const newChatRef = doc(chatCol);
			await setDoc(newChatRef, { id: newChatRef.id, name: 'Private chat', type: 'private', members: users, created_at: Timestamp.fromDate(new Date()) });
			users.forEach(async el => {
				await updateDoc(await getUserRef(el), {
					chats: arrayUnion(newChatRef.id)
				});
			});
			return newChatRef.id;
		} catch (e) {
			console.error(e);
		}
	};
	const joinPrivateChat = async companionId => {
		try {
			const senderId = await getUid();
			return (await isPrivateChatExists(senderId, companionId)) || (await createPrivateChat(senderId, companionId));
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const getChatInfoById = async chatId => {
		try {
			const uid = await getUid();
			const chat = await getDoc(doc(chatCol, chatId));
			if (chat.exists()) {
				const { members, ...data } = chat.data();
				if (chat.data().type === 'private') {
					const opponentInfo = (await Promise.all(members.filter(mId => mId !== uid).map(getUserdataById))).map(m => m.info);
					return {
						...data,
						opponent: opponentInfo.length === 1 ? opponentInfo[0] : opponentInfo,
						created_at: chat.data().created_at.toDate()
					};
				} else {
					const membersInfo = (await Promise.all(chat.data().members.map(getUserdataById))).map(m => m.info);
					return {
						...data,
						members: membersInfo,
						created_at: chat.data().created_at.toDate()
					};
				}
			}
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	return {
		joinPrivateChat,
		getChatInfoById
	};
};
