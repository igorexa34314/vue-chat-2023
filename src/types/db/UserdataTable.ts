import type { UserInfo as FirebaseUserInfo, UserMetadata } from 'firebase/auth';

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export interface userdata {
	info: UserInfo;
	chats?: string[];
	friends?: string[];
}
export interface UserInfo extends Writeable<Omit<FirebaseUserInfo, 'photoURL' | 'providerId'>> {
	photoURL?: FirebaseUserInfo['photoURL'];
	created_at: UserMetadata['creationTime'] | Date;
	birthday_date?: Date;
	gender?: Gender;
	metadata?: any;
}
export type Gender = 'unknown' | 'male' | 'female';
