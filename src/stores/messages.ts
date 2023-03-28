import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import type { UserInfo } from '@/types/db/UserdataTable';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { Message as DBMessage, TextMessage, MediaMessage as MediaDBMessage, FileMessage as FileDBMessage } from '@/types/db/MessagesTable';

export interface MediaMessage extends Omit<MediaDBMessage, 'images'> {
	images: (Omit<MediaDBMessage['images'][number], 'thumbnail'> & { thumbnail: string })[];
}

export interface FileMessage extends Omit<FileDBMessage, 'files'> {
	files: (Omit<FileDBMessage['files'][number], 'thumbnail'> & { thumbnail?: string })[];
}

export interface Message<T extends DBMessage['type'] = DBMessage['type']> extends Omit<DBMessage, 'sender_id' | 'content' | 'created_at'> {
	type: T;
	content: T extends 'text' ? TextMessage : T extends 'media' ? MediaMessage : T extends 'file' ? FileMessage : TextMessage | MediaMessage | FileMessage;
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

	return {
		messages,
		lastVisible,
		addMessage,
		clearMessages,
		modifyMessage,
		deleteMessageById,
		deleteMessages
	};
});
