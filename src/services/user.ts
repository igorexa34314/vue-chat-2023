import { timestampToDate } from './../utils/helpers';
import { storage, db, functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { useUserdataStore } from '@/stores/userdata';
import {
	getDoc,
	onSnapshot,
	doc,
	updateDoc,
	collection,
	where,
	documentId,
	query,
	getDocs,
	CollectionReference,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AuthService } from '@/services/auth';
import { updateProfile } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import { fbErrorHandler as errorHandler } from '@/utils/errorHandler';
import { UserData as DBUserData, UserInfo as DBUserInfo } from '@/types/db/UserdataTable';
import { ParsedTimestamps } from '@/types/db/helpers';

export interface UserInfo extends ParsedTimestamps<DBUserInfo> {}
export interface UserData extends Omit<DBUserData, 'info'> {
	info: UserInfo;
}
export type PublicUserInfo = Pick<UserInfo, 'uid' | 'displayName' | 'photoURL'>;

export class UserService {
	static usersCol = collection(db, 'users') as CollectionReference<DBUserData>;

	static getUserDocRef(uid: DBUserInfo['uid']) {
		return doc(UserService.usersCol, uid);
	}

	static async fetchAuthUser() {
		try {
			const userDocRef = UserService.getUserDocRef(await AuthService.getUid());
			return onSnapshot(userDocRef, userSnapshot => {
				if (userSnapshot && userSnapshot.exists()) {
					const { setUserData } = useUserdataStore();
					const { info, ...udata } = userSnapshot.data();
					const { birthday_date, created_at, updated_at, ...uinfo } = info;
					setUserData({
						...udata,
						info: {
							...uinfo,
							created_at: created_at.toDate(),
							birthday_date: birthday_date?.toDate() ?? null,
							updated_at: updated_at?.toDate() ?? null,
						},
					});
				}
			});
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async getUserInfoById(uid: DBUserInfo['uid']) {
		try {
			const userSnapshot = await getDoc(UserService.getUserDocRef(uid));
			if (userSnapshot && userSnapshot.exists()) {
				const { created_at, updated_at, birthday_date, ...info } = userSnapshot.data().info;
				return {
					...info,
					...timestampToDate({ created_at, updated_at, birthday_date }),
				} as UserInfo;
			}
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async getUsersbyIds(...userIds: UserInfo['uid'][]) {
		const usersData: PublicUserInfo[] = [];
		const q = query(this.usersCol, where(documentId(), 'in', userIds));
		const usersSnapshot = await getDocs(q);

		usersSnapshot.forEach(doc => {
			const { uid, displayName, photoURL } = doc.data().info;
			usersData.push({ uid, displayName, photoURL });
		});

		return usersData;
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
				await updateDoc(UserService.getUserDocRef(await AuthService.getUid()), {
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
			await updateDoc(UserService.getUserDocRef(await AuthService.getUid()), infoField);
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async addToFriend(userId: DBUserInfo['uid']) {
		try {
			const addToFriendById = httpsCallable<{ userId: string }, { success: true }>(functions, 'addToFriendById');

			const res = await addToFriendById({ userId });
			return res.data;
		} catch (e) {
			return errorHandler(e);
		}
	}
}
