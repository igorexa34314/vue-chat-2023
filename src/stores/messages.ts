import { defineStore } from 'pinia';
import { readonly, ref, shallowReadonly, shallowRef } from 'vue';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { Message } from '@/services/message';

export type Direction = 'top' | 'bottom';
export type LastVisibleFbRef = Record<Direction, QueryDocumentSnapshot<DocumentData> | null>;

export const useMessagesStore = defineStore('messages', () => {
	const messages = ref<Message[]>([]);

	const lastVisible = shallowRef<LastVisibleFbRef>({
		top: null,
		bottom: null,
	});

	const setLastVisible = (val: Partial<LastVisibleFbRef>) => {
		lastVisible.value = { ...lastVisible.value, ...val };
	};

	const addMessage = (msg: Message, direction: 'start' | 'end' = 'end') => {
		messages.value = direction === 'end' ? [...messages.value, msg] : [msg, ...messages.value];
	};
	const addMessages = (msgs: Message[], direction: 'start' | 'end' = 'end') => {
		messages.value =
			direction === 'end' ? [...messages.value, ...msgs] : [...msgs, ...messages.value];
	};
	const deleteMessageById = (messageId: Message['id']) => {
		messages.value = messages.value.filter(m => m.id !== messageId);
	};
	const modifyMessage = (newMsg: Message) => {
		messages.value = messages.value.map(m => (m.id === newMsg.id ? newMsg : m));
	};
	const deleteMessages = (count = 10, direction: 'start' | 'end' = 'end') => {
		return direction === 'end'
			? messages.value.splice(-count, count)
			: messages.value.splice(0, count);
	};

	const isLoading = ref(false);

	const setLoading = (val: boolean) => {
		isLoading.value = val;
	};

	const isLoadingFirst = ref(false);

	const setFirstLoading = (val: boolean) => {
		isLoadingFirst.value = val;
		isLoading.value = val;
	};

	const $reset = () => {
		isLoading.value = false;
		messages.value = [];
		lastVisible.value = { top: null, bottom: null };
	};

	return {
		messages: shallowReadonly(messages),
		lastVisible: readonly(lastVisible),
		setLastVisible,
		addMessage,
		addMessages,
		modifyMessage,
		deleteMessageById,
		deleteMessages,
		isLoading: readonly(isLoading),
		setLoading,
		isLoadingFirst: readonly(isLoadingFirst),
		setFirstLoading,
		$reset,
	};
});
