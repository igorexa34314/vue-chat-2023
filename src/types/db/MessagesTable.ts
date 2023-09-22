import { DocumentReference, Timestamp } from 'firebase/firestore';
import { UserData } from '@/types/db/UserdataTable';

export type ContentType = 'text' | 'media' | 'file';
export type AttachmentType = Exclude<ContentType, 'text'>;

export interface Message {
	content: MessageContent;
	sender: DocumentReference<UserData>;
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
