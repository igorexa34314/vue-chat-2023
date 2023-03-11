import type { UserInfo } from '@/stores/userdata';
import type { MediaMessage } from '@/types/message/MediaMessage';
import { FileMessage } from '@/types/message/FileMessage';

type message_id = string;
type MessageType = 'text' | 'media' | 'file';
type SenderId = UserInfo['uid'];
export type subtitle = string;
export type message_text = string;

export interface Message {
	id: message_id;
	created_at: Date;
	type: MessageType;
	content: TextMessage | MediaMessage | FileMessage;
	sender: SenderId;
}
export interface MessageWithSenderInfo extends Omit<Message, 'sender'> {
	sender: SenderInfo;
}
export interface SenderInfo {
	id: SenderId;
	displayName: UserInfo['displayName'];
	photoURL: UserInfo['photoURL'];
}
export interface TextMessage {
	text: message_text;
}
