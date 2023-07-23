import { defineStore } from 'pinia';
import { ref, reactive, Ref } from 'vue';
import { UserInfo } from '@/types/db/UserdataTable';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Message as DBMessage, MessageAttachment, MessageContent } from '@/types/db/MessagesTable';

export interface MessageContentWithPreview extends Omit<MessageContent, 'attachments'> {
	attachments: (Omit<MessageAttachment, 'thumbnail' | 'raw'> & { thumbnail: string; raw: MessageAttachment['raw'] & { previewURL?: string } })[];
}

export interface Message extends Omit<DBMessage, 'sender_id' | 'created_at' | 'content'> {
	content: MessageContentWithPreview;
	sender: { id: UserInfo['uid'] } & Pick<UserInfo, 'displayName' | 'photoURL'>;
	created_at: Date;
}
export type Direction = 'top' | 'bottom';
export type LastVisibleFbRef = Record<Direction, QueryDocumentSnapshot<DocumentData> | null>;

export const useMessagesStore = defineStore('messages', () => {
	const messages = ref<Message[]>([]);
	const lastVisible: LastVisibleFbRef = reactive({
		top: null,
		bottom: null
	});
	const $reset = () => {
		messages.value = [];
		lastVisible.top = null;
		lastVisible.bottom = null;
	};
	const addMessage = (msg: Message, direction: 'start' | 'end' = 'end') => {
		return direction === 'end' ? messages.value.push(msg) : messages.value.unshift(msg);
	};
	const deleteMessageById = (messageId: Message['id']) => {
		messages.value = messages.value.filter(m => m.id === messageId);
	};
	const modifyMessage = (newMsg: Message) => {
		messages.value = messages.value.map(m => (m.id === newMsg.id ? newMsg : m));
	};
	const deleteMessages = (count = 10, direction: 'start' | 'end' = 'end') => {
		return direction === 'end' ? messages.value.splice(-count, count) : messages.value.splice(0, count);
	};
	const setAttachPreviewURL = (attachRefInstance: Ref<MessageContentWithPreview['attachments'][number]>, previewURL: string) => {
		if (previewURL) {
			attachRefInstance.value.raw.previewURL = previewURL;
		}
	};
	return {
		messages,
		lastVisible,
		addMessage,
		$reset,
		modifyMessage,
		deleteMessageById,
		deleteMessages,
		setAttachPreviewURL
	};
});
