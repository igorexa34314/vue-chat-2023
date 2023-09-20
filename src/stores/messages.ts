import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Message, MediaAttachment } from '@/services/message';

export type Direction = 'top' | 'bottom';
export type LastVisibleFbRef = Record<Direction, QueryDocumentSnapshot<DocumentData> | null>;

export const useMessagesStore = defineStore('messages', () => {
	const messages = ref<Message[]>([]);
	const isLoading = ref(false);

	const lastVisible = ref<LastVisibleFbRef>({
		top: null,
		bottom: null,
	});

	const addMessage = (msg: Message, direction: 'start' | 'end' = 'end') => {
		return direction === 'end' ? messages.value.push(msg) : messages.value.unshift(msg);
	};
	const deleteMessageById = (messageId: Message['id']) => {
		messages.value = messages.value.filter(m => m.id !== messageId);
	};
	const modifyMessage = (newMsg: Message) => {
		messages.value = messages.value.map(m => (m.id === newMsg.id ? newMsg : m));
	};
	const deleteMessages = (count = 10, direction: 'start' | 'end' = 'end') => {
		return direction === 'end' ? messages.value.splice(-count, count) : messages.value.splice(0, count);
	};
	const setAttachPreviewURL = (attachRefInstance: Ref<MediaAttachment>, previewURL: string) => {
		if (previewURL) {
			attachRefInstance.value.raw.previewURL = previewURL;
		}
	};

	const $reset = () => {
		messages.value = [];
		lastVisible.value = { top: null, bottom: null };
	};

	return {
		messages,
		isLoading,
		lastVisible,
		addMessage,
		$reset,
		modifyMessage,
		deleteMessageById,
		deleteMessages,
		setAttachPreviewURL,
	};
});
