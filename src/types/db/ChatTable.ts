export interface ChatInfo {
	id: string;
	name: string;
	avatar: string | null;
	type: 'self' | 'private' | 'group';
	created_at: Date;
	members: string[];
}
