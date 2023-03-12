import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export type MessageType = 'text' | 'media' | 'file';

export interface Message {
	id: string;
	type: MessageType;
	content: TextMessage | MediaMessage | FileMessage;
	sender_id: User['uid'];
	created_at: Date | Timestamp;
}

export interface TextMessage {
	text: string;
}

export interface FileMessage {
	subtitle: string;
	files: {
		id: string;
		type: string;
		fullname: string;
		fullpath: string;
		downloadURL: string;
	}[];
}

export interface MediaMessage {
	subtitle: string;
	images: {
		id: string;
		type: string;
		fullname: string;
		fullpath: string;
		downloadURL: string;
		sizes: {
			w: number;
			h: number;
		};
	}[];
}
