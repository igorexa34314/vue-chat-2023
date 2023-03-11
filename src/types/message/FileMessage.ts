import type { subtitle } from '@/types/message/Message';

export interface FileMessage {
	subtitle: subtitle;
	files: File[] | FileList;
}
