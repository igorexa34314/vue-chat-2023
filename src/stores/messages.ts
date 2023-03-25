import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { collection, doc, orderBy, query, onSnapshot, limit, getDoc, getDocs, startAfter } from 'firebase/firestore';
import { chatCol, fetchMessages, loadMoreMessages } from '@/services/message';
import { fbErrorHandler as errorHandler } from '@/services/errorHandler';
import type { UserInfo } from '@/types/db/UserdataTable';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { ChatInfo } from '@/services/chat';
import type { Message as DBMessage, TextMessage, MediaMessage as MediaDBMessage, FileMessage as FileDBMessage } from '@/types/db/MessagesTable';

export interface MediaMessage extends Omit<MediaDBMessage, 'images'> {
	images: (Omit<MediaDBMessage['images'][number], 'thumbnail'> & { thumbnail: string })[];
}

export interface FileMessage extends Omit<FileDBMessage, 'files'> {
	files: (Omit<FileDBMessage['files'][number], 'thumbnail'> & { thumbnail?: string })[];
}

export interface Message<T extends DBMessage['type'] = DBMessage['type']> extends Omit<DBMessage, 'sender_id' | 'content'> {
	type: T;
	content: T extends 'text' ? TextMessage : T extends 'media' ? MediaMessage : T extends 'file' ? FileMessage : TextMessage | MediaMessage | FileMessage;
	sender: { id: UserInfo['uid'] } & Pick<UserInfo, 'displayName' | 'photoURL'>;
}
export type direction = 'top' | 'bottom';
export type LastVisibleFbRef = Record<direction, QueryDocumentSnapshot<DocumentData> | null>;

export const useMessagesStore = defineStore('messages', () => {
	const messages = ref<Message[]>([]);
	const lastVisible: LastVisibleFbRef = reactive({
		top: null,
		bottom: null
	});
	const clearMessages = () => {
		messages.value = [];
	};
	const addMessage = (msg: Message, direction: 'start' | 'end' = 'end') => {
		if (direction === 'end') {
			messages.value.push(msg);
		} else {
			messages.value.unshift(msg);
		}
	};
	const deleteMessageById = (messageId: Message['id']) => {
		messages.value = messages.value.filter(m => m.id === messageId);
	};
	const modifyMessage = (newMsg: Message) => {
		messages.value = messages.value.map(m => (m.id === newMsg.id ? newMsg : m));
	};
	const deleteMessages = (count = 10, direction: 'start' | 'end' = 'end') => {
		if (direction === 'end') {
			messages.value.splice(-count, count);
		} else {
			messages.value.splice(0, count);
		}
	};
	const fetchChatMessages = async (chatId: ChatInfo['id'], lmt: number = 10) => {
		try {
			const messagesCol = collection(doc(chatCol, chatId), 'messages');
			const q = query(messagesCol, orderBy('created_at', 'desc'), limit(lmt));
			const unsubscribe = onSnapshot(q, async messagesRef => {
				(await fetchMessages(messagesRef))?.forEach(({ changeType, message }) => {
					if (changeType === 'added') {
						addMessage(message, 'end');
					} else if (changeType === 'modified') {
						modifyMessage(message);
					}
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
				(await loadMoreMessages(messagesRef))?.forEach(m => {
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
		modifyMessage,
		deleteMessageById,
		deleteMessages,
		fetchChatMessages,
		loadMoreChatMessages
	};
});
