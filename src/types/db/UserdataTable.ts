import { UserInfo as FirebaseUserInfo } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { Writeable } from '@/types/db/helpers';

export interface UserData {
	info: UserInfo;
	chats?: string[];
	friends?: string[];
}

export interface UserInfo extends Writeable<Pick<FirebaseUserInfo, 'uid' | 'displayName' | 'email' | 'photoURL'>> {
	gender: 'unknown' | 'male' | 'female';
	birthday_date: Timestamp | null;
	created_at: Timestamp;
	updated_at: Timestamp | null;
}
