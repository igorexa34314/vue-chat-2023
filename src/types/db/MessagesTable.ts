import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface Message {
	id: string;
	type: 'text' | 'media' | 'file';
	content: MessageContent;
	sender_id: User['uid'];
	created_at: Date | Timestamp;
}

export interface MessageContent {
	text: string;
	attachments?: MessageAttachment[];
}

export interface MessageAttachment {
	id: string;
	type: string;
	fullname: string;
	raw: {
		bucket: string;
		fullpath: string;
		fullsize: number;
		sizes?: {
			w: number;
			h: number;
		};
		downloadURL: string;
	};
	thumbnail?: {
		bucket: string;
		fullpath: string;
		fullsize: number;
	};
}
