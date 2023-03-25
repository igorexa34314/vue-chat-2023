import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface Message {
	id: string;
	type: 'text' | 'media' | 'file';
	content: TextMessage | MediaMessage | FileMessage;
	sender_id: User['uid'];
	created_at: Date | Timestamp;
}

export interface TextMessage {
	text: string;
}

export interface MediaMessage {
	subtitle: string;
	images: MessageImageItem[];
}

export interface FileMessage {
	subtitle: string;
	files: MessageFileItem[];
}

export type MessageImageItem = Required<MessageFileItem>;
export interface MessageFileItem {
	id: string;
	type: string;
	fullname: string;
	fullpath: string;
	fullsize: number;
	downloadURL?: string;
	sizes?: {
		w: number;
		h: number;
	};
	thumbnail?: {
		fullname: string;
		fullpath: string;
		size: number;
	};
}
