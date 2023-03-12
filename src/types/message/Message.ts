import type { UserInfo } from '@/stores/userdata';
import type { MediaMessage } from '@/types/message/MediaMessage';
import type { FileMessage } from '@/types/message/FileMessage';
import type { Timestamp } from 'firebase/firestore';

export interface Message<T extends MessageType =  MessageType> {
	id: string;
	type: T;
	content: T extends  'text' ? TextMessage : T extends  'media' ?  MediaMessage : T extends  'file' ? FileMessage:   TextMessage | MediaMessage | FileMessage;
	sender: SenderInfo;
	created_at: Date | Timestamp;
};

export type SenderId = UserInfo['uid'];
export type subtitle = string;
export type MessageType = 'text' | 'media' | 'file';
export type MsgWithSenderId = { sender_id: SenderId } & Omit<Message, 'sender'>;

export interface SenderInfo {
	id: SenderId;
	displayName: UserInfo['displayName'];
	photoURL: UserInfo['photoURL'];
}
export interface TextMessage {
	text: string;
}
