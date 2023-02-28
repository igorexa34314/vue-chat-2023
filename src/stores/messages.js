import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { useAuth } from '@/composables/auth';
import { useUserdataStore } from '@/stores/userdata';
import { getFirestore, collection, doc, setDoc, orderBy, query, Timestamp, onSnapshot, limit, startAt, getDoc, getDocs, startAfter } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, getBlob } from 'firebase/storage';
import { uuidv4 } from '@firebase/util';

export const useMessagesStore = defineStore('messages', () => {
	const { getUid } = useAuth();
	const { getUserdataById } = useUserdataStore();
	const db = getFirestore();
	const storage = getStorage();
	const chatCol = collection(db, 'chat');

	const messages = ref([]);
	const lastVisible = reactive({
		top: null,
		bottom: null
	});
	const clearMessages = () => {
		messages.value = [];
	};
	const addMessage = (msg, direction = 'end') => {
		if (direction === 'end') {
			messages.value.push(msg);
		} else {
			messages.value.unshift(msg);
		}
	};
	const deleteMessages = (count = 10, direction = 'end') => {
		if (direction === 'end') {
			messages.value.splice(messages.value.length - count, count);
		} else {
			messages.value.splice(0, count);
		}
	};

	const createMessage = async ({ chatId, type, content }) => {
		try {
			const messageRef = doc(collection(doc(chatCol, chatId), 'messages'));
			if (type === 'media' && content.image.data instanceof File) {
				const { subtitle, image } = content;
				const { data, ...rest } = image;
				const ext = data.name.split('.')[data.name.split('.').length - 1];
				const imageRef = storageRef(storage, `chat/${chatId}/messageData/${messageRef.id}/${uuidv4() + '.' + ext}`);
				await uploadBytes(imageRef, data, {
					name: data.name,
					contentType: data.type
				});
				content = {
					subtitle,
					image: {
						name: data.name.slice(0, -ext.length - 1),
						ext,
						fullpath: imageRef.fullPath,
						downloadURL: await getDownloadURL(imageRef),
						...rest
					}
				};
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
	const getFullMessageInfo = async message => {
		try {
			const { sender_id, ...m } = message;
			const promises = [];
			promises.push(getUserdataById(sender_id));
			if (m.content.image && Object.keys(m.content.image).length) {
				promises.push(getBlob(storageRef(storage, m.content.image.fullpath)));
			}
			return (await Promise.all(promises)).reduce(
				(acc, res) => {
					if (res.info) {
						const { displayName, photoURL } = res.info;
						acc.sender = { id: sender_id, displayName, photoURL };
					} else {
						acc.content.image = {
							...m.content.image,
							blob: res
						};
					}
					return acc;
				},
				{ ...m }
			);
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
					promises.push(getFullMessageInfo(m));
				});
				(await Promise.all(promises)).forEach(m => {
					addMessage(m, 'end');
				});
				if (messagesRef.size >= lmt) {
					lastVisible.top = messagesRef.docs[messagesRef.docs.length - 1];
				}
			});
			return unsubscribe;
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const loadMoreChatMessages = async (chatId, direction = 'top', perPage = 10) => {
		try {
			if (lastVisible[direction]) {
				const messagesCol = collection(doc(chatCol, chatId), 'messages');
				const q = query(messagesCol, orderBy('created_at', direction === 'top' ? 'desc' : 'asc'), startAfter(lastVisible[direction]), limit(perPage));
				const messagesRef = await getDocs(q);
				if (messagesRef.empty) {
					lastVisible[direction] = null;
					return;
				}
				if (messages.value.length > 40) {
					deleteMessages(perPage, direction === 'top' ? 'end' : 'start');
					const msgBeforeDel = await getDoc(doc(messagesCol, messages.value[direction === 'top' ? messages.value.length - 1 : 0].id));
					lastVisible[direction === 'top' ? 'bottom' : 'top'] = msgBeforeDel;
				}
				const initialMessages = [];
				const promises = [];
				messagesRef.forEach(doc => {
					initialMessages.push({ ...doc.data(), created_at: doc.data().created_at.toDate() });
				});
				initialMessages.forEach(m => {
					promises.push(getFullMessageInfo(m));
				});
				(await Promise.all(promises)).forEach(m => {
					addMessage(m, direction === 'top' ? 'start' : 'end');
				});
				lastVisible[direction] = messagesRef.size >= perPage ? messagesRef.docs[messagesRef.docs.length - 1] : null;
			}
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	return {
		messages,
		lastVisible,
		clearMessages,
		deleteMessages,
		createMessage,
		fetchChatMessages,
		loadMoreChatMessages
	};
});
