import { storage, db } from '@/firebase';
import { useUserdataStore } from '@/stores/userdata';
import {
	getDoc,
	setDoc,
	onSnapshot,
	doc,
	updateDoc,
	arrayUnion,
	Timestamp,
	collection
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getUid } from '@/services/auth';
import { createSelfChat } from '@/services/chat';
import { v4 as uuidv4 } from 'uuid';
import { fbErrorHandler as errorHandler } from '@/services/errorHandler';
import { UserData, UserInfo } from '@/types/db/UserdataTable';

const usersCol = collection(db, 'userdata');
export const getUserRef = (uid: UserInfo['uid'] | undefined) => doc(usersCol, uid);

export const createUser = async ({
	uid,
	email,
	displayName,
	phoneNumber,
	photoURL,
	metadata
}: Omit<UserInfo, 'created_at'>) => {
	try {
		const userRef = getUserRef(uid);
		const user = await getDoc(userRef);
		if (user.exists()) {
			await updateUserdata({ displayName, photoURL, phoneNumber });
		} else {
			const userdata = {
				info: {
					uid,
					email,
					displayName,
					phoneNumber,
					photoURL,
					created_at: Timestamp.fromDate(new Date(metadata.creationTime)) || Timestamp.now()
					// location: (await navigator.geolocation.getCurrentPosition()) || 'unknown'
				},
				chats: [],
				friends: []
			};
			await setDoc(getUserRef(uid), userdata, { merge: true });
			await createSelfChat(uid);
		}
	} catch (e) {
		errorHandler(e, 'Error adding document: ');
	}
};
export const updateUserAvatar = async (avatar: File | File[]) => {
	try {
		if (avatar instanceof File) {
			const avatarRef = storageRef(
				storage,
				`userdata/${await getUid()}/avatar/${uuidv4() + '.' + avatar.name.split('.').at(-1)}`
			);
			await uploadBytes(avatarRef, avatar, {
				contentType: avatar.type
			});
			const avatarURL = await getDownloadURL(avatarRef);
			await updateDoc(getUserRef(await getUid()), {
				'info.photoURL': avatarURL
			});
		}
	} catch (e) {
		errorHandler(e);
	}
};
export const updateUserdata = async (newData: Partial<UserInfo>) => {
	try {
		const infoField = Object.assign(
			{},
			...(Object.keys(newData) as (keyof Partial<UserInfo>)[]).map(key => ({
				[`info.${key}`]: newData[key]
			}))
		);
		await updateDoc(getUserRef(await getUid()), infoField);
	} catch (e) {
		errorHandler(e);
	}
};
export const fetchAuthUserdata = async () => {
	try {
		const userRef = getUserRef(await getUid());
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
						...rest
					}
				});
			}
		});
	} catch (e) {
		errorHandler(e);
	}
};
export const getUserdataById = async (uid: UserInfo['uid']) => {
	try {
		const udata = await getDoc(getUserRef(uid));
		if (udata && udata.exists()) {
			return udata.data() as UserData;
		}
	} catch (e) {
		errorHandler(e);
	}
};
export const addToFriend = async (uid: UserInfo['uid']) => {
	try {
		await updateDoc(getUserRef(await getUid()), {
			friendsUid: arrayUnion(uid)
		});
	} catch (e) {
		errorHandler(e);
	}
};
