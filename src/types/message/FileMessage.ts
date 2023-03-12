import type { subtitle } from '@/types/message/Message';

export interface FileMessage {
	subtitle: subtitle;
	files: AttachedFile[];
}

export interface AttachedFile {
	id: string;
	type: string;
	fullname: string;
	fullpath: string;
	preview?: Blob;
	downloadURL: string;
}
