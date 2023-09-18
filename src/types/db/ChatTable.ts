import { UserInfo } from '@/types/db/UserdataTable';
import { Timestamp } from 'firebase/firestore';

export type ChatType = 'saved' | 'private' | 'group' | 'public';

export interface ChatInfo<T extends ChatType = ChatType> {
	id: string;
	name: string;
	description: string;
	avatar: string | null;
	type: T;
	created_by: UserInfo['uid'];
	members: T extends 'saved' ? never : UserInfo['uid'][];
	created_at: Timestamp;
	updated_at: Timestamp | null;
}
