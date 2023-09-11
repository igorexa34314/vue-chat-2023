import { storage, db } from '@/firebase';
import { useUserdataStore } from '@/stores/userdata';
import { getDoc, setDoc, onSnapshot, doc, updateDoc, arrayUnion, Timestamp, collection } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AuthService } from '@/services/auth';
import { ChatService } from '@/services/chat';
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
			errorHandler(e);
		}
	}

	static async getUserdataById(uid: UserInfo['uid']) {
		try {
			const udata = await getDoc(UserService.getUserRef(uid));
			if (udata && udata.exists()) {
				return udata.data() as UserData;
			}
		} catch (e) {
			errorHandler(e);
		}
	}

	static async createUser({ uid, email, displayName, phoneNumber, photoURL, metadata }: Omit<UserInfo, 'created_at'>) {
		try {
			const userRef = UserService.getUserRef(uid);
			const user = await getDoc(userRef);
			if (user.exists()) {
				await UserService.updateUserdata({ displayName, photoURL, phoneNumber });
			} else {
				const userdata = {
					info: {
						uid,
						email,
						displayName,
						phoneNumber,
						photoURL,
						created_at: Timestamp.fromDate(new Date(metadata.creationTime)) || Timestamp.now(),
						// location: (await navigator.geolocation.getCurrentPosition()) || 'unknown'
					},
					chats: [],
					friends: [],
				};
				await setDoc(UserService.getUserRef(uid), userdata, { merge: true });
				await ChatService.createSelfChat(uid);
			}
		} catch (e) {
			errorHandler(e, 'Error adding document: ');
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
			errorHandler(e);
		}
	}

	static async updateUserdata(newData: Partial<UserInfo>) {
		try {
			const infoField = Object.assign(
				{},
				...(Object.keys(newData) as (keyof Partial<UserInfo>)[]).map(key => ({
					[`info.${key}`]: newData[key],
				}))
			);
			await updateDoc(UserService.getUserRef(await AuthService.getUid()), infoField);
		} catch (e) {
			errorHandler(e);
		}
	}

	static async addToFriend(uid: UserInfo['uid']) {
		try {
			await updateDoc(UserService.getUserRef(await AuthService.getUid()), {
				friends: arrayUnion(uid),
			});
		} catch (e) {
			errorHandler(e);
		}
	}
}
