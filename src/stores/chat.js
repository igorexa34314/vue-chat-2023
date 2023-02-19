import { defineStore } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useUserdataStore } from '@/stores/userdata';
import { getFirestore, collection, addDoc, doc, setDoc, updateDoc, arrayUnion, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { ref } from 'vue';

export const useChatStore = defineStore('chat', () => {
	const messages = ref([]);
	const { getUid } = useAuthStore();
	const { getUserRef } = useUserdataStore();
	const db = getFirestore();
	const messagesCol = collection(db, 'messages');
	const chatCol = collection(db, 'chat');

	const addMessage = message => {
		messages.value.push(message);
	};
	const createMessage = async messageData => {
		try {
			await addDoc(messagesCol, { ...messageData, from: await getUid() });
		} catch (e) {
			console.error(e);
		}
	};
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
			await setDoc(newChatRef, { id: newChatRef.id, type: 'private', members: users, created_at: Timestamp.fromDate(new Date()) });
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
		}
	};
	return {
		messages,
		addMessage,
		joinPrivateChat,
		createMessage
	};
});
