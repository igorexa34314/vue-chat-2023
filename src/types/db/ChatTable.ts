import type { UserData } from '@/types/db/UserdataTable';
import { DocumentReference, Timestamp } from 'firebase/firestore';

export type ChatType = 'saved' | 'private' | 'group' | 'public';

export type ChatInfo<T extends ChatType = ChatType> = {
	name: string;
	description: string;
	avatar: string | null;
	type: T;
	created_by: DocumentReference<UserData>;
	created_at: Timestamp;
	updated_at: Timestamp | null;
} & ([T] extends ['saved'] ? object : { members: DocumentReference<UserData>[] });
