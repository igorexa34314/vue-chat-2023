import { UserInfo as FirebaseUserInfo, UserMetadata } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export interface UserData {
	info: UserInfo;
	chats?: string[];
	friends?: string[];
}
export interface UserInfo extends Writeable<FirebaseUserInfo> {
	created_at: Date | Timestamp | UserMetadata['creationTime'];
	birthday_date?: Date | Timestamp;
	gender?: 'unknown' | 'male' | 'female';
	metadata?: any;
}
