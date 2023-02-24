import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuth } from '@/composables/auth';
import { useUserdataStore } from '@/stores/userdata';
import { getFirestore, collection, doc, setDoc, orderBy, query, Timestamp, onSnapshot, limit, startAt, getDoc, getDocs, startAfter } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { uuidv4 } from '@firebase/util';

export const useMessagesStore = defineStore('messages', () => {
	const { getUid } = useAuth();
	const { getUserdataById } = useUserdataStore();
	const db = getFirestore();
	const storage = getStorage();
	const chatCol = collection(db, 'chat');

	const messages = ref([]);
	const lastVisible = ref(null);
	const clearMessages = () => {
		messages.value = [];
	};
	const addMessage = msg => {
		messages.value.push(msg);
	};
	const addMessageToStart = msg => {
		messages.value.unshift(msg);
	};

	const createMessage = async ({ chatId, type, content }) => {
		try {
			const messageRef = doc(collection(doc(chatCol, chatId), 'messages'));
			if (content.image instanceof File) {
				const { subtitle, image } = content;
				const imageRef = storageRef(storage, `chat/${chatId}/messageData/${messageRef.id}/${uuidv4() + '.' + image.name.split('.')[image.name.split('.').length - 1]}`);
				await uploadBytes(imageRef, image, {
					name: image.name,
					contentType: image.type
				});
				const imageURL = await getDownloadURL(imageRef);
				content = { subtitle, imageURL };
			}
			await setDoc(messageRef, {
				id: messageRef.id,
				type,
				content,
				created_at: Timestamp.fromDate(new Date()),
				sender_id: await getUid()
			});
		} catch (e) {
			console.error(e);
			throw e.code || e;
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
	const fetchChatMessages = async (chatId, lmt = 10) => {
		try {
			const messagesCol = collection(doc(chatCol, chatId), 'messages');
			const q = query(messagesCol, orderBy('created_at', 'desc'), limit(lmt));
			const unsubscribe = onSnapshot(q, async messagesRef => {
				const initialMessages = [];
				const promises = [];

				messagesRef.docChanges().forEach(change => {
					if (change.type === 'added') {
						initialMessages.unshift({ ...change.doc.data(), created_at: change.doc.data().created_at.toDate() });
					}
				});
				initialMessages.forEach(m => {
					promises.push(getMessageSenderInfo(m));
				});
				(await Promise.all(promises)).forEach(m => {
					addMessage(m);
				});
				if (messagesRef.size >= 10) lastVisible.value = messagesRef.docs[messagesRef.docs.length - 1];
			});
			return unsubscribe;
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const loadMoreChatMessages = async (chatId, perPage = 10) => {
		try {
			if (lastVisible.value) {
				const messagesCol = collection(doc(chatCol, chatId), 'messages');
				const q = query(messagesCol, orderBy('created_at', 'desc'), startAfter(lastVisible.value), limit(perPage));
				const messagesRef = await getDocs(q);
				const initialMessages = [];
				const promises = [];
				messagesRef.forEach(doc => {
					if (doc.exists()) {
						initialMessages.unshift({ ...doc.data(), created_at: doc.data().created_at.toDate() });
					}
				});
				initialMessages.forEach(m => {
					promises.unshift(getMessageSenderInfo(m));
				});
				(await Promise.all(promises)).forEach(m => {
					addMessageToStart(m);
				});
				if (messagesRef.size < perPage) {
					lastVisible.value = null;
				} else {
					lastVisible.value = messagesRef.docs[messagesRef.docs.length - 1];
				}
			}
		} catch (e) {
			console.error(e);
		}
	};
	return {
		messages,
		lastVisible,
		clearMessages,
		createMessage,
		fetchChatMessages,
		loadMoreChatMessages
	};
});
