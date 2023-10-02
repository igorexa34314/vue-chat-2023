import { storage, db, functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { useUserStore } from '@/stores/user';
import { timestampConverter } from '@/utils/firestore';
import {
	getDoc,
	onSnapshot,
	doc,
	updateDoc,
	Unsubscribe,
	collection,
	DocumentReference,
	CollectionReference,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AuthService } from '@/services/auth';
import { User, updateProfile } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import { fbErrorHandler as errorHandler } from '@/utils/errorHandler';
import { UserData as DBUserData, UserInfo as DBUserInfo, ChatRecord, FriendRecord } from '@/types/db/UserdataTable';
import { ParsedTimestamps } from '@/types/db/helpers';
import { ChatInfo, ChatService } from '@/services/chat';
import { ChatType } from '@/types/db/ChatTable';

export type PublicUserInfo = ParsedTimestamps<DBUserInfo>;
export type DisplayUserInfo = Pick<PublicUserInfo, 'uid' | 'firstname' | 'lastname' | 'photoURL'>;

export type UserChat<T extends ChatType = ChatType> = Omit<ParsedTimestamps<ChatRecord<T>[string]>, 'ref'> & {
	info: ChatInfo<T>;
};
export interface UserFriend extends Omit<ParsedTimestamps<FriendRecord[string]>, 'ref'> {
	info: PublicUserInfo;
}

export class UserService {
	private static usersCol = collection(db, 'users') as CollectionReference<DBUserData>;

	static getUserDocRef<U extends DBUserData = DBUserData>(uid: User['uid']): DocumentReference<U>;
	static getUserDocRef<U extends DBUserData = DBUserData, T extends keyof U = keyof U>(
		uid: User['uid'],
		dataType: T
	): CollectionReference<U[T]>;
	static getUserDocRef<
		U extends DBUserData = DBUserData,
		T extends keyof U = keyof U,
		K extends keyof U[T] = keyof U[T],
	>(uid: User['uid'], dataType: T, docId: K): U[T][K];

	static getUserDocRef<
		U extends DBUserData = DBUserData,
		T extends keyof U = keyof U,
		K extends keyof U[T] = keyof U[T],
	>(uid: User['uid'], dataType?: T, docId?: K) {
		const userDocRef = doc(this.usersCol, uid) as DocumentReference<U>;
		if (!dataType) {
			return userDocRef;
		}
		const userDocRefWithPrivacy = collection(userDocRef, dataType.toString()) as CollectionReference<U[T]>;
		return !docId ? userDocRefWithPrivacy : (doc(userDocRefWithPrivacy, docId.toString()) as U[T][K]);
	}

	static getUInfoDocRef(uid: User['uid']) {
		return UserService.getUserDocRef(uid, 'public', 'info').withConverter(timestampConverter<DBUserInfo>());
	}

	static async subscribeAuthUserChats(uid?: User['uid']) {
		try {
			const userStore = useUserStore();
			userStore.isChatsLoading = true;
			uid ??= await AuthService.getUid();
			const chatsDocRef = UserService.getUserDocRef(uid, 'private', 'chats').withConverter(
				timestampConverter<ChatRecord>()
			);
			return onSnapshot(chatsDocRef, async chatsSnap => {
				if (chatsSnap.exists()) {
					const chats = chatsSnap.data();
					const userChatRefs = (Object.values(chats) as (typeof chats)[string][]).map(({ ref }) => ref);
					const chatsInfo = await ChatService.getUserChatsInfoByRef(...userChatRefs);
					const userChats = chatsInfo
						.map(info => ({ member_since: chats[info.id].member_since, info }) as UserChat)
						.sort((a, b) => +(b.member_since ?? a.info.created_at) - +(a.member_since ?? a.info.created_at));
					userStore.setChats(userChats);
					if (userStore.isChatsLoading) {
						userStore.isChatsLoading = false;
					}
				}
			});
		} catch (e) {
			return errorHandler(e);
		}
	}
	static async subscribeAuthUserFriends(uid?: User['uid']) {
		try {
			uid ??= await AuthService.getUid();
			const friendsDocRef = UserService.getUserDocRef(uid, 'private', 'friends').withConverter(
				timestampConverter<FriendRecord>()
			);
			return onSnapshot(friendsDocRef, friendsSnap => {
				if (friendsSnap.exists()) {
					const friends = friendsSnap.data();
					const { setFriends } = useUserStore();
					Promise.all(
						(Object.values(friends) as (typeof friends)[string][]).map(async ({ ref, ...data }) => ({
							...data,
							info: (await UserService.getUserInfoById(ref.id))!,
						}))
					).then(setFriends);
				}
			});
		} catch (e) {
			return errorHandler(e);
		}
	}
	static async subscribeAuthUserInfo(uid?: User['uid']) {
		try {
			uid ??= await AuthService.getUid();
			const infoDocRef = UserService.getUInfoDocRef(uid);
			return onSnapshot(infoDocRef, infoSnap => {
				if (infoSnap.exists()) {
					const info = infoSnap.data();
					const { setInfo } = useUserStore();
					setInfo(info);
				}
			});
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async fetchAuthUser() {
		const uid = await AuthService.getUid();
		const unsubInfo = await UserService.subscribeAuthUserInfo(uid);
		const unsubChats = await UserService.subscribeAuthUserChats(uid);

		return (() => {
			unsubInfo();
			unsubChats();
		}) as Unsubscribe;
	}

	static async getUserInfoById(uid: User['uid']) {
		try {
			const userSnapshot = await getDoc(UserService.getUInfoDocRef(uid));
			if (userSnapshot.exists()) {
				const info = userSnapshot.data();
				return info as PublicUserInfo;
			}
			return null;
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async getUserDisplayInfo(uid: User['uid']) {
		const info = await UserService.getUserInfoById(uid);
		return info
			? ({
					uid: info.uid,
					firstname: info.firstname,
					lastname: info.lastname,
					photoURL: info.photoURL,
			  } as DisplayUserInfo)
			: null;
	}

	static async uploadUserAvatar(avatar: File | File[]) {
		try {
			if (avatar instanceof File) {
				const avatarRef = storageRef(
					storage,
					`users/${await AuthService.getUid()}/avatar/${uuidv4() + '.' + avatar.name.split('.').at(-1)}`
				);
				await uploadBytes(avatarRef, avatar, {
					contentType: avatar.type,
				});
				const photoURL = await getDownloadURL(avatarRef);
				return photoURL;
			}
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async updateUserInfo({ firstname, lastname, ...newData }: Partial<PublicUserInfo>) {
		try {
			const user = await AuthService.getCurrentUser();
			if (!user) {
				throw new Error('User unauthenticated');
			}
			if (firstname || lastname || newData.photoURL) {
				await updateProfile(user, {
					displayName: [firstname, lastname].filter(Boolean).join(' ') ?? user.displayName,
					photoURL: newData.photoURL ?? user.photoURL,
				});
			}
			await updateDoc(UserService.getUInfoDocRef(user.uid), { firstname, lastname, ...newData });
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async addToFriend(userId: User['uid']) {
		try {
			const addToFriendById = httpsCallable<{ userId: string }, { success: true }>(functions, 'addToFriendById');

			const res = await addToFriendById({ userId });
			return res.data;
		} catch (e) {
			return errorHandler(e);
		}
	}
}
