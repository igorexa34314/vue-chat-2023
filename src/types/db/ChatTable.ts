import { UserInfo } from '@/types/db/UserdataTable';
export type ChatType = 'saved' | 'private' | 'group' | 'public';

export interface ChatInfo<T extends ChatType = ChatType> {
	id: string;
	name: string;
	avatar: string | null;
	type: T;
	created_at: Date;
	created_by: UserInfo['uid'];
	members: T extends 'saved' ? never : UserInfo['uid'][];
}
