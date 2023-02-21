import { useAuth } from '@/composables/auth';
import { useUserdataStore } from '@/stores/userdata';
import { getFirestore, collection, doc, setDoc, updateDoc, arrayUnion, query, where, getDoc, getDocs, Timestamp } from 'firebase/firestore';

export const useChat = () => {
	const { getUid } = useAuth();
	const { getUserRef } = useUserdataStore();
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
	const getChatMembers = async chatId => {
		try {
			const chat = await getDoc(doc(chatCol, chatId));
			if (chat.exists()) {
				return chat.data().members;
			}
			return;
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	return {
		joinPrivateChat,
		getChatMembers
	};
};
