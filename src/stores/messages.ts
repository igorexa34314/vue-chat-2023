import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { getUid, fbErrorHandler as errorHandler } from '@/services/auth';
import { useUserdataStore } from '@/stores/userdata';
import { getFirestore, collection, doc, setDoc, orderBy, query, Timestamp, onSnapshot, limit, getDoc, getDocs, startAfter } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { UserInfo } from '@/types/db/UserdataTable';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { ChatInfo } from '@/services/chat';
import type { Message as DBMessage, TextMessage, MediaMessage, FileMessage } from '@/types/db/MessagesTable';

export interface Message<T extends DBMessage['type'] = DBMessage['type']> extends Omit<DBMessage, 'sender_id'> {
	type: T;
	content: T extends 'text' ? TextMessage : T extends 'media' ? MediaMessage : T extends 'file' ? FileMessage : TextMessage | MediaMessage | FileMessage;
	sender: { id: UserInfo['uid'] } & Pick<UserInfo, 'displayName' | 'photoURL'>;
}
export interface AttachFormContent {
	subtitle: MediaMessage['subtitle'] | FileMessage['subtitle'];
	files: {
		id: string;
		fileData: File;
		sizes?: MediaMessage['images'][number]['sizes'];
	}[];
}
export type direction = 'top' | 'bottom';
export type LastVisibleFbRef = Record<direction, QueryDocumentSnapshot<DocumentData> | null>;

export const useMessagesStore = defineStore('messages', () => {
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
	const uploadMedia = async <T extends MediaMessage>(chatId: ChatInfo['id'], messageId: Message['id'], { subtitle, files }: AttachFormContent) => {
		try {
			if (files.every(f => f.fileData instanceof File)) {
				const promises = <Promise<T['images'][number]>[]>[];
				for (const file of files) {
					promises.push(
						(async () => {
							const { fileData, id, ...data } = file;
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
							} as T['images'][number];
						})()
					);
				}
				return {
					subtitle,
					images: await Promise.all(promises)
				} as Awaited<T>;
			}
		} catch (e: unknown) {
			errorHandler(e);
		}
	};
	const uploadFile = async <T extends FileMessage>(chatId: ChatInfo['id'], messageId: Message['id'], { subtitle, files }: AttachFormContent) => {
		try {
			if (files.every(f => f.fileData instanceof File)) {
				const promises = <Promise<T['files'][number]>[]>[];
				for (const file of files) {
					promises.push(
						(async () => {
							const { fileData, id } = file;
							const fileRef = storageRef(
								storage,
								`chat/${chatId}/messageData/${messageId}/${id + '.' + fileData.name.split('.')[fileData.name.split('.').length - 1]}`
							);
							await uploadBytes(fileRef, fileData, {
								contentType: fileData.type
							});
							return {
								id,
								type: fileData.type,
								fullname: fileData.name,
								fullpath: fileRef.fullPath,
								downloadURL: await getDownloadURL(fileRef),
								size: fileData.size
							} as T['files'][number];
						})()
					);
				}
				return {
					subtitle,
					files: await Promise.all(promises)
				} as Awaited<T>;
			}
		} catch (e: unknown) {
			errorHandler(e);
		}
	};
	const createMessage = async (chatId: ChatInfo['id'], type: Message['type'], content: TextMessage | AttachFormContent) => {
		try {
			const messageRef = doc(collection(doc(chatCol, chatId), 'messages'));
			let attachContent: MediaMessage | FileMessage | null = null;
			if (type === 'media') {
				attachContent = (await uploadMedia(chatId, messageRef.id, content as AttachFormContent)) as MediaMessage;
			} else if (type === 'file') {
				attachContent = (await uploadFile(chatId, messageRef.id, content as AttachFormContent)) as FileMessage;
			}
			await setDoc(messageRef, {
				id: messageRef.id,
				type,
				content: attachContent || content,
				created_at: Timestamp.fromDate(new Date()),
				sender_id: await getUid()
			});
		} catch (e: unknown) {
			errorHandler(e);
		}
	};
	const getMessageSenderInfo = async (message: DBMessage) => {
		try {
			const { sender_id, ...m } = message;
			const { displayName, photoURL } = (await getUserdataById(sender_id as string))?.info as UserInfo;
			return { ...m, sender: { id: sender_id, displayName, photoURL } } as Message;
		} catch (e: unknown) {
			errorHandler(e);
		}
	};
	const fetchChatMessages = async (chatId: ChatInfo['id'], lmt: number = 10) => {
		try {
			const messagesCol = collection(doc(chatCol, chatId), 'messages');
			const q = query(messagesCol, orderBy('created_at', 'desc'), limit(lmt));
			const unsubscribe = onSnapshot(q, async messagesRef => {
				const initialMessages = [] as DBMessage[];
				const promises = [] as Promise<Message>[];

				messagesRef.docChanges().forEach(change => {
					const { created_at, ...msgData } = change.doc.data() as DBMessage;
					if (change.type === 'added') {
						initialMessages.unshift({ ...msgData, created_at: (<Timestamp>created_at).toDate() });
					}
				});
				initialMessages.forEach(m => {
					promises.push(getMessageSenderInfo(m) as Promise<Message>);
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
			errorHandler(e);
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
				const initialMessages = [] as DBMessage[];
				const promises = [] as Promise<Message>[];
				messagesRef.forEach(doc => {
					const { created_at, ...msgData } = doc.data() as DBMessage;
					initialMessages.push({ ...msgData, created_at: (<Timestamp>created_at).toDate() });
				});
				initialMessages.forEach(m => {
					promises.push(getMessageSenderInfo(m) as Promise<Message>);
				});
				(await Promise.all(promises)).forEach(m => {
					addMessage(m, direction === 'top' ? 'start' : 'end');
				});
				lastVisible[direction] = messagesRef.size >= perPage ? messagesRef.docs[messagesRef.docs.length - 1] : null;
			}
		} catch (e: unknown) {
			errorHandler(e);
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
