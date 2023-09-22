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
	FirestoreDataConverter,
	QueryDocumentSnapshot,
	UpdateData,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AuthService } from '@/services/auth';
import { User, updateProfile } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import { fbErrorHandler as errorHandler } from '@/utils/errorHandler';
import { UserData as DBUserData, UserInfo as DBUserInfo } from '@/types/db/UserdataTable';
import { ParsedTimestamps } from '@/types/db/helpers';

export type UserInfo = ParsedTimestamps<DBUserInfo> & { uid: User['uid'] };
export interface UserData extends Omit<DBUserData, 'info'> {
	info: UserInfo;
}
export type PublicUserInfo = Pick<UserInfo, 'uid' | 'displayName' | 'photoURL'>;

export class UserService {
	private static userConverter: FirestoreDataConverter<UserData, DBUserData> = {
		toFirestore: user => {
			if (user.info) {
				const { uid, ...uinfo } = user.info as DBUserInfo & { uid: User['uid'] };
				return { ...user, info: uinfo } as DBUserData;
			}
			return user as DBUserData;
		},
		fromFirestore: (snapshot: QueryDocumentSnapshot<DBUserData>, options) => {
			const { info, ...udata } = snapshot.data(options);
			const { birthday_date, created_at, updated_at, ...uinfo } = info;
			return {
				...udata,
				info: {
					...uinfo,
					...timestampToDate({ created_at, updated_at, birthday_date }),
					uid: snapshot.ref.id,
				},
			} as UserData;
		},
	};

	static usersCol = collection(db, 'users').withConverter(UserService.userConverter);

	static getUserDocRef(uid: User['uid']) {
		return doc(UserService.usersCol, uid);
	}

	static async fetchAuthUser() {
		try {
			const userDocRef = UserService.getUserDocRef(await AuthService.getUid());
			return onSnapshot(userDocRef, userSnap => {
				if (userSnap.exists()) {
					const { setUserData } = useUserdataStore();
					const udata = userSnap.data();

					setUserData(udata);
				}
			});
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async getUserInfoById(uid: User['uid']) {
		try {
			const userSnapshot = await getDoc(UserService.getUserDocRef(uid));
			if (userSnapshot.exists()) {
				const info = userSnapshot.data().info;
				return info;
			}
			return null;
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async getUsersbyIds(...users: UserInfo['uid'][]) {
		const q = query(this.usersCol, where(documentId(), 'in', users));
		const usersSnapshot = await getDocs(q);

		return usersSnapshot.docs.map(doc => {
			const { uid, displayName, photoURL } = doc.data().info;
			return { uid, displayName, photoURL } as PublicUserInfo;
		});
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
				} as Omit<UpdateData<DBUserData>, 'chats' | 'friends'>);
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

			const updateInfoData: Omit<UpdateData<DBUserData>, 'chats' | 'friends'> = Object.assign(
				{},
				...(Object.keys(newData) as (keyof Partial<UserInfo>)[]).map(key => ({
					[`info.${key}`]: newData[key],
				}))
			);
			await updateDoc(UserService.getUserDocRef(await AuthService.getUid()), updateInfoData);
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
