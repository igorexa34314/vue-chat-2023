import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { useAuth } from '@/composables/auth';
import { useUserdataStore } from '@/stores/userdata';
import { getFirestore, collection, doc, setDoc, orderBy, query, Timestamp, onSnapshot, limit, getDoc, getDocs, startAfter } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, getBlob } from 'firebase/storage';
import { uuidv4 } from '@firebase/util';

type id = string;
type direction = 'start' | 'end';
type MessageType = 'text' | 'media' | 'file';
type SenderId = id;

export interface Message {
	id: string;
	created_at: Date;
	type: MessageType;
	content: TextMessageContent;
	sender: Sender | SenderId;
}
export interface Sender {
	id: id;
	displayName: string;
	photoURL: string;
}
export interface TextMessageContent {
	text: string;
}
export const useMessagesStore = defineStore('messages', () => {
	const { getUid } = useAuth();
	const { getUserdataById } = useUserdataStore();
	const db = getFirestore();
	const storage = getStorage();
	const chatCol = collection(db, 'chat');

	const messages = ref<Array<Message>>([]);
	const lastVisible = reactive({
		top: null,
		bottom: null
	});
	const clearMessages = () => {
		messages.value = [];
	};
	const addMessage = (msg: Message, direct?: direction) => {
		if (direct === 'end' || !direct) {
			messages.value.push(msg);
		} else {
			messages.value.unshift(msg);
		}
	};
	const deleteMessages = (count = 10, direct?: direction) => {
		if (direct === 'end' || !direct) {
			messages.value.splice(-count, count);
		} else {
			messages.value.splice(0, count);
		}
	};
	const uploadMedia = async (chatId, messageId: Message['id'], { subtitle, files }) => {
		if (files.every(f => f.data instanceof File)) {
			const promises = [];
			for (const file of files) {
				promises.push(
					(async () => {
						const { data: fileData, id, ...data } = file;
						const imageRef = storageRef(
							storage,
							`chat/${chatId}/messageData/${messageId}/${id + '.' + fileData.name.split('.')[fileData.name.split('.').length - 1]}`
						);
						await uploadBytes(imageRef, fileData, {
							name: fileData.name,
							contentType: fileData.type
						});
						return {
							id,
							fullname: fileData.name,
							type: fileData.type,
							fullpath: imageRef.fullPath,
							downloadURL: await getDownloadURL(imageRef),
							...data
						};
					})()
				);
			}
			return {
				subtitle,
				images: await Promise.all(promises)
			};
		}
	};
	const uploadFile = async (chatId, messageId, { subtitle, file }) => {
		if (file instanceof File) {
			const fileRef = storageRef(storage, `chat/${chatId}/messageData/${messageId}/${uuidv4() + '.' + file.name.split('.')[file.name.split('.').length - 1]}`);
			await uploadBytes(fileRef, file, {
				name: file.name,
				contentType: file.type
			});
			return {
				subtitle,
				file: {
					fullname: file.name,
					type: file.type,
					fullpath: fileRef.fullPath,
					size: file.size,
					downloadURL: await getDownloadURL(fileRef)
				}
			};
		}
	};
	const createMessage = async ({ chatId, type, content }) => {
		try {
			const messageRef = doc(collection(doc(chatCol, chatId), 'messages'));
			if (type === 'media') {
				content = await uploadMedia(chatId, messageRef.id, content);
			} else if (type === 'file') {
				content = await uploadFile(chatId, messageRef.id, content);
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
					promises.push(getMessageSenderInfo(m));
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
					promises.push(getMessageSenderInfo(m));
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
