export type ChatType = 'self' | 'private' | 'group';

export interface ChatInfo {
	id: string;
	name: string;
	avatar?: string;
	type: ChatType;
	created_at: Date;
	members: string[];
}
