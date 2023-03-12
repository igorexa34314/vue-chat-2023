import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { useAuth } from '@/composables/auth';
import { FirebaseError } from 'firebase/app';
import { useUserdataStore } from '@/stores/userdata';
import { getFirestore, collection, doc, setDoc, orderBy, query, Timestamp, onSnapshot, limit, getDoc, getDocs, startAfter } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { uuidv4 } from '@firebase/util';
import type { UserInfo } from '@/stores/userdata';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { ChatInfo } from '@/composables/chat';
import type { Message, MsgWithSenderId } from '@/types/message/Message';
import type { MediaMessage, MessageImage } from '@/types/message/MediaMessage';
import type { AttachedFile, FileMessage } from '@/types/message/FileMessage';

export type direction = 'top' | 'bottom';
export type LastVisibleFbRef = Record<direction, QueryDocumentSnapshot<DocumentData> | null>;

export const useMessagesStore = defineStore('messages', () => {
	const { getUid } = useAuth();
	const { getUserdataById } = useUserdataStore();
	const db = getFirestore();
	const storage = getStorage();
	const chatCol = collection(db, 'chat');

	const messages = ref<Message[]>([]);
	const lastVisible: LastVisibleFbRef = reactive({
		top: null,
		bottom: null
	});
	const clearMessages = () => {
		messages.value = [];
	};
	const addMessage = (msg: Message, direction?: 'start' | 'end') => {
		if (direction === 'end' || !direction) {
			messages.value.push(msg);
		} else {
			messages.value.unshift(msg);
		}
	};
	const deleteMessages = (count = 10, direction?: 'start' | 'end') => {
		if (direction === 'end' || !direction) {
			messages.value.splice(-count, count);
		} else {
			messages.value.splice(0, count);
		}
	};
	const uploadMedia = async (chatId: ChatInfo['id'], messageId: Message<'media'>['id'], { subtitle, files }) => {
		try {
			if (files.every(f => f.data instanceof File)) {
				const promises = <Promise<MessageImage>[]>[];
				for (const file of files) {
					promises.push(
						(async () => {
							const { data: fileData, id, ...data } = file;
							const imageRef = storageRef(
								storage,
								`chat/${chatId}/messageData/${messageId}/${id + '.' + fileData.name.split('.')[fileData.name.split('.').length - 1]}`
							);
							await uploadBytes(imageRef, fileData, {
								contentType: fileData.type
							});
							return {
								id,
								type: fileData.type,
								fullname: fileData.name,
								fullpath: imageRef.fullPath,
								downloadURL: await getDownloadURL(imageRef),
								...data
							} as MessageImage;
						})()
					);
				}
				return {
					subtitle,
					images: await Promise.all(promises)
				} as MediaMessage;
			}
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const uploadFile = async (chatId: ChatInfo['id'], messageId: Message<'file'>['id'], { subtitle, files }) => {
		try {
			if (files.every(f => f.data instanceof File)) {
				const promises = <Promise<AttachedFile>[]>[];
				for (const file of files) {
					promises.push(
						(async () => {
							const { data: fileData, id, ...data } = file;
							const fileRef = storageRef(
								storage,
								`chat/${chatId}/messageData/${messageId}/${uuidv4() + '.' + file.name.split('.')[file.name.split('.').length - 1]}`
							);
							await uploadBytes(fileRef, file, {
								contentType: file.type
							});
							return {
								id,
								type: fileData.type,
								fullname: fileData.name,
								fullpath: fileRef.fullPath,
								downloadURL: await getDownloadURL(fileRef),
								...data
							} as AttachedFile;
						})()
					);
				}
				return {
					subtitle,
					files: await Promise.all(promises)
				} as FileMessage;
			}
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const createMessage = async (chatId: ChatInfo['id'], type: Message['type'], content: Message['content']) => {
		try {
			const messageRef = doc(collection(doc(chatCol, chatId), 'messages'));
			if (type === 'media') {
				content = await uploadMedia(chatId, messageRef.id, <Message<'media'>['content']>content);
			} else if (type === 'file') {
				content = await uploadFile(chatId, messageRef.id, content);
			}
			await setDoc(messageRef, {
				id: messageRef.id,
				type,
				content: content,
				created_at: Timestamp.fromDate(new Date()),
				sender_id: await getUid()
			});
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const getMessageSenderInfo = async (message: MsgWithSenderId) => {
		try {
			const { sender_id, ...m } = message;
			const { displayName, photoURL } = (await getUserdataById(sender_id as string))?.info as UserInfo;
			return { ...m, sender: { id: sender_id, displayName, photoURL } } as Message;
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const fetchChatMessages = async (chatId: ChatInfo['id'], lmt: number = 10) => {
		try {
			const messagesCol = collection(doc(chatCol, chatId), 'messages');
			const q = query(messagesCol, orderBy('created_at', 'desc'), limit(lmt));
			const unsubscribe = onSnapshot(q, async messagesRef => {
				const initialMessages = [] as MsgWithSenderId[];
				const promises = [] as Promise<Message>[];

				messagesRef.docChanges().forEach(change => {
					const { created_at, ...msgData } = change.doc.data() as MsgWithSenderId;
					if (change.type === 'added') {
						initialMessages.unshift({ ...msgData, created_at: (<Timestamp>created_at).toDate() });
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
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const loadMoreChatMessages = async (chatId: ChatInfo['id'], direction: direction = 'top', perPage: number = 10) => {
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
					lastVisible[direction === 'top' ? 'bottom' : 'top'] = msgBeforeDel as LastVisibleFbRef[direction];
				}
				const initialMessages = [] as MsgWithSenderId[];
				const promises = [] as Promise<Message>[];
				messagesRef.forEach(doc => {
					const { created_at, ...msgData } = doc.data() as MsgWithSenderId;
					initialMessages.push({ ...msgData, created_at: (<Timestamp>created_at).toDate() });
				});
				initialMessages.forEach(m => {
					promises.push(getMessageSenderInfo(m));
				});
				(await Promise.all(promises)).forEach(m => {
					addMessage(m, direction === 'top' ? 'start' : 'end');
				});
				lastVisible[direction] = messagesRef.size >= perPage ? messagesRef.docs[messagesRef.docs.length - 1] : null;
			}
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
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
