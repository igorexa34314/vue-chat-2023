import { UserInfo as FirebaseUserInfo } from 'firebase/auth';
import { DocumentReference, Timestamp } from 'firebase/firestore';
import { Writeable } from '@/types/db/helpers';
import { ChatInfo } from '@/types/db/ChatTable';

export interface UserData {
	info: UserInfo;
	chats: DocumentReference<ChatInfo>[];
	friends: DocumentReference<UserData>[];
}

export interface UserInfo
	extends Writeable<Pick<FirebaseUserInfo, 'displayName' | 'email' | 'photoURL' | 'phoneNumber'>> {
	gender: 'unknown' | 'male' | 'female';
	birthday_date: Timestamp | null;
	created_at: Timestamp;
	updated_at: Timestamp | null;
}
