import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuth } from '@/composables/auth';
import { useUserdataStore } from '@/stores/userdata';
import { getFirestore, collection, doc, setDoc, orderBy, query, Timestamp, onSnapshot, limit, startAt, getDoc } from 'firebase/firestore';

export const useMessagesStore = defineStore('messages', () => {
	const { getUid } = useAuth();
	const { getUserdataById } = useUserdataStore();
	const db = getFirestore();

	const messages = ref([]);

	const chatCol = collection(db, 'chat');

	const clearMessages = () => {
		messages.value = [];
	};
	const addMessage = msg => {
		messages.value.push(msg);
	};

	const createMessage = async ({ chatId, content }) => {
		try {
			const messageRef = doc(collection(doc(chatCol, chatId), 'messages'));
			await setDoc(messageRef, {
				id: messageRef.id,
				content,
				created_at: Timestamp.fromDate(new Date()),
				sender_id: await getUid()
			});
		} catch (e) {
			console.error(e);
		}
	};
	const getMessageSenderInfo = async message => {
		try {
			const { sender_id, ...m } = message;
			const { displayName, photoURL } = (await getUserdataById(sender_id)).info;
			return { ...m, sender: { id: sender_id, displayName, photoURL } };
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const fetchChatMessages = async chatId => {
		try {
			const messagesCol = collection(doc(chatCol, chatId), 'messages');
			const q = query(messagesCol, orderBy('created_at', 'desc'), limit(10));
			onSnapshot(q, async messagesRef => {
				let initialMessages = [];
				const promises = [];
				messagesRef.forEach(doc => {
					if (!messages.value.find(m => m.id === doc.id)) {
						initialMessages.unshift({ ...doc.data(), created_at: doc.data().created_at.toDate() });
					}
				});
				initialMessages.forEach(m => {
					promises.push(getMessageSenderInfo(m));
				});
				(await Promise.all(promises)).forEach(m => {
					addMessage(m);
				});
			});
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const loadMoreChatMessages = async (chatId, page = 0, perPage = 10) => {
		const lastVisible = await fetchChatMessages(chatId);
		const messagesCol = collection(doc(chatCol, chatId), 'messages');
		const q = query(messagesCol, orderBy('created_at', 'desc'), startAfter(lastVisible + page), limit(perPage));
	};
	return {
		messages,
		clearMessages,
		createMessage,
		fetchChatMessages,
		loadMoreChatMessages
	};
});
