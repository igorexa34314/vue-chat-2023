import type { subtitle } from '@/types/message/Message';

export interface MediaMessage {
	subtitle: subtitle;
	images: MessageImage[];
}
export interface MessageImage {
	id: string;
	type: string;
	fullname: string;
	fullpath: string;
	sizes: {
		w: number;
		h: number;
	};
	preview?: Blob;
	downloadURL: string;
}
