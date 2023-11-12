import { DocumentReference, Timestamp } from 'firebase/firestore';
import type { UserInfo as FirebaseUserInfo } from 'firebase/auth';
import type { Writeable } from '@/types/db/helpers';
import type { ChatInfo, ChatType } from '@/types/db/ChatTable';

export interface UserData {
	public: PublicUserDataCollection;
	private: PrivateUserDataCollection;
}

interface PublicUserDataCollection {
	info: DocumentReference<UserInfo>;
}
interface PrivateUserDataCollection {
	security: DocumentReference<Pick<FirebaseUserInfo, 'email' | 'phoneNumber'>>;
	chats: DocumentReference<ChatRecord>;
	friends: DocumentReference<FirebaseUserInfo>;
}

export type ChatRecord<T extends ChatType = ChatType> = Record<
	DocumentReference['id'],
	{
		ref: DocumentReference<ChatInfo<T>>;
	} & ([T] extends ['saved'] ? object : { member_since: Timestamp })
>;

export type FriendRecord = Record<
	FirebaseUserInfo['uid'],
	{
		friend_since: Timestamp;
		ref: DocumentReference<UserData>;
	}
>;

export interface UserInfo extends Writeable<Pick<FirebaseUserInfo, 'uid' | 'photoURL'>> {
	firstname: string;
	lastname: string;
	gender: 'unknown' | 'male' | 'female';
	birthday_date: Timestamp | null;
	created_at: Timestamp;
	updated_at: Timestamp | null;
}
