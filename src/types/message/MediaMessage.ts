import type { subtitle } from '@/types/message/Message';

export interface MediaMessage {
	subtitle: subtitle;
	images: MessageImage[];
}
export interface MessageImage {
	downloadURL: string;
	fullname: string;
	fullpath: string;
	id: string;
	previewURL?: Blob;
	sizes: ImageSizes;
	type: string;
}
export interface ImageSizes {
	w: number;
	h: number;
}
