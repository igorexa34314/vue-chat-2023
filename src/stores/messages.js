import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUserdataStore } from '@/stores/userdata';
import { getFirestore, collection, doc, addDoc, setDoc, updateDoc, arrayUnion, orderBy, query, where, getDocs, Timestamp, onSnapshot, limit } from 'firebase/firestore';

export const useMessagesStore = defineStore('messages', () => {
	const { getUid } = useAuthStore();
	const { getUserdataById } = useUserdataStore();
	const db = getFirestore();

	const messages = ref([]);

	const chatCol = collection(db, 'chat');

	const clearMessages = () => {
		messages.value = [];
	};
	const addMessage = message => {
		messages.value.push(message);
	};

	const createMessage = async ({ chatId, content }) => {
		try {
			const messageRef = doc(collection(doc(chatCol, chatId), 'messages'));
			await setDoc(messageRef, {
				id: messageRef.id,
				content,
				created_at: Timestamp.fromDate(new Date()),
				sender: await getUid()
			});
		} catch (e) {
			console.error(e);
		}
	};
	const fetchChatMessages = async chatId => {
		const messagesCol = collection(doc(chatCol, chatId), 'messages');
		const q = query(messagesCol, orderBy('created_at', 'desc'), limit(10));
		onSnapshot(q, async messagesRef => {
			let initialMessages = [];
			messagesRef.forEach(doc => {
				if (!messages.value.find(m => m.id === doc.id)) {
					initialMessages.unshift({ ...doc.data(), created_at: doc.data().created_at.toDate() });
				}
			});
			for (let m of initialMessages) {
				const { displayName, photoURL } = await getUserdataById(m.sender);
				addMessage({ ...m, sender: { id: m.sender, displayName, photoURL } });
			}
		});
	};
	return {
		messages,
		clearMessages,
		createMessage,
		fetchChatMessages
	};
});
