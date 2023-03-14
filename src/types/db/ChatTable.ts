export interface ChatInfo {
	id: string;
	name: string;
	avatar?: string;
	type: 'self' | 'private' | 'group';
	created_at: Date;
	members: string[];
}
