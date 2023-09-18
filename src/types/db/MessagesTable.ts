import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export type ContentType = 'text' | 'media' | 'file';
export type AttachmentType = Exclude<ContentType, 'text'>;

export interface Message {
	id: string;
	content: MessageContent;
	sender_id: User['uid'];
	created_at: Timestamp;
	updated_at: Timestamp | null;
}

export interface MessageContent {
	text: string;
	type: ContentType;
	attachments?: MessageAttachment[];
}

export interface MessageAttachment<T extends AttachmentType = AttachmentType> {
	id: string;
	fileType: string;
	fullname: string;
	created_at?: Timestamp;
	raw: {
		bucket: string;
		fullpath: string;
		fullsize: number;
		sizes: T extends 'media'
			? {
					w: number;
					h: number;
			  }
			: never;
		downloadURL: string;
	};
	thumbnail: T extends 'media'
		? {
				bucket: string;
				fullpath: string;
				fullsize: number;
		  }
		: never;
}
