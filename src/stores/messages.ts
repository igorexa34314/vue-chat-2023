import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { collection, doc, orderBy, query, onSnapshot, limit, getDoc, getDocs, startAfter } from 'firebase/firestore';
import { chatCol, fetchMessages, loadMoreMessages } from '@/services/message';
import { fbErrorHandler as errorHandler } from '@/services/errorHandler';
import type { UserInfo } from '@/types/db/UserdataTable';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { ChatInfo } from '@/services/chat';
import type { Message as DBMessage, TextMessage, MediaMessage, FileMessage } from '@/types/db/MessagesTable';

export interface Message<T extends DBMessage['type'] = DBMessage['type']> extends Omit<DBMessage, 'sender_id'> {
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
	const fetchChatMessages = async (chatId: ChatInfo['id'], lmt: number = 10) => {
		try {
			const messagesCol = collection(doc(chatCol, chatId), 'messages');
			const q = query(messagesCol, orderBy('created_at', 'desc'), limit(lmt));
			const unsubscribe = onSnapshot(q, async messagesRef => {
				(await fetchMessages(messagesRef))?.forEach(m => {
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
		deleteMessages,
		fetchChatMessages,
		loadMoreChatMessages
	};
});
