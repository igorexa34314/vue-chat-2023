import { storage, db, functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { useUserdataStore } from '@/stores/userdata';
import { getDoc, onSnapshot, doc, updateDoc, Timestamp, collection } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AuthService } from '@/services/auth';
import { updateProfile } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import { fbErrorHandler as errorHandler } from '@/utils/errorHandler';
import { UserData, UserInfo } from '@/types/db/UserdataTable';

export class UserService {
	static usersCol = collection(db, 'users');

	static getUserRef(uid: UserInfo['uid']) {
		return doc(UserService.usersCol, uid);
	}

	static async fetchAuthUser() {
		try {
			const userRef = UserService.getUserRef(await AuthService.getUid());
			return onSnapshot(userRef, udata => {
				if (udata && udata.exists()) {
					const { setUserData } = useUserdataStore();
					const { info, ...data } = udata.data() as UserData;
					const { birthday_date, created_at, ...rest } = info as UserInfo;
					setUserData({
						...data,
						info: {
							created_at: (<Timestamp>created_at)?.toDate(),
							birthday_date: (<Timestamp>birthday_date)?.toDate(),
							...rest,
						},
					});
				}
			});
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async getUserdataById(uid: UserInfo['uid']) {
		try {
			const udata = await getDoc(UserService.getUserRef(uid));
			if (udata && udata.exists()) {
				return udata.data() as UserData;
			}
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async updateUserAvatar(avatar: File | File[]) {
		try {
			if (avatar instanceof File) {
				const avatarRef = storageRef(
					storage,
					`users/${await AuthService.getUid()}/avatar/${uuidv4() + '.' + avatar.name.split('.').at(-1)}`
				);
				await uploadBytes(avatarRef, avatar, {
					contentType: avatar.type,
				});
				const avatarURL = await getDownloadURL(avatarRef);
				await updateDoc(UserService.getUserRef(await AuthService.getUid()), {
					'info.photoURL': avatarURL,
				});
			}
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async updateUserInfo(newData: Partial<UserInfo>) {
		try {
			if (newData.displayName || newData.photoURL) {
				const user = await AuthService.getCurrentUser();
				if (!user) {
					throw new Error('User unauthenticated');
				}
				updateProfile(user, {
					displayName: newData.displayName ?? user.displayName,
					photoURL: newData.photoURL ?? user.photoURL,
				});
			}

			const infoField = Object.assign(
				{},
				...(Object.keys(newData) as (keyof Partial<UserInfo>)[]).map(key => ({
					[`info.${key}`]: newData[key],
				}))
			);
			await updateDoc(UserService.getUserRef(await AuthService.getUid()), infoField);
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async addToFriend(userId: UserInfo['uid']) {
		try {
			const addToFriendById = httpsCallable<{ userId: string }, { success: true }>(functions, 'addToFriendById');

			const res = await addToFriendById({ userId });
			return res.data;
		} catch (e) {
			return errorHandler(e);
		}
	}
}
