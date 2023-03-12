import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getFirestore, getDoc, setDoc, onSnapshot, doc, updateDoc, arrayUnion, Timestamp, collection } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/composables/auth';
import { useChat } from '@/composables/chat';
import { uuidv4 } from '@firebase/util';
import { FirebaseError } from '@firebase/util';
import type { User as FirebaseUser, UserInfo as FirebaseUserInfo, UserMetadata } from 'firebase/auth';

export type Gender = 'unknown' | 'male' | 'female';
export interface UserData {
	info: UserInfo | null | undefined;
	chats?: string[];
	friends?: string[];
}

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export interface UserInfo extends Writeable<Omit<FirebaseUserInfo, 'photoURL' | 'providerId'>> {
	photoURL?: FirebaseUserInfo['photoURL'];
	created_at: UserMetadata['creationTime'] | Date;
	birthday_date?: Date;
	gender?: Gender;
	metadata?: any;
}

export const useUserdataStore = defineStore('userdata', () => {
	const auth = useAuth();
	const { createSelfChat } = useChat();
	const storage = getStorage();
	const db = getFirestore();
	const usersCol = collection(db, 'userdata');

	const userdata = ref<UserData | null>();

	const clearData = () => {
		userdata.value = null;
	};
	const setUserData = (data: UserData) => {
		userdata.value = data;
	};
	const setUserInfo = (info: UserInfo) => {
		userdata.value!.info = info;
	};
	const getUserRef = (uid: UserInfo['uid'] | undefined) => doc(usersCol, uid);

	const createUser = async ({ uid, email, displayName, phoneNumber, photoURL, metadata }: FirebaseUser) => {
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
						created_at: Timestamp.fromDate(new Date(metadata.creationTime || Date.now()))
						// location: (await navigator.geolocation.getCurrentPosition()) || 'unknown'
					},
					chats: [],
					friends: []
				};
				await setDoc(getUserRef(uid), userdata, { merge: true });
				await createSelfChat(uid);
			}
		} catch (e: unknown) {
			console.error('Error adding document: ', e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const updateUserAvatar = async (avatar: File | File[]) => {
		try {
			if (avatar instanceof File) {
				const avatarRef = storageRef(storage, `userdata/${await auth.getUid()}/avatar/${uuidv4() + '.' + avatar.name.split('.')[avatar.name.split('.').length - 1]}`);
				await uploadBytes(avatarRef, avatar, {
					contentType: avatar.type
				});
				const avatarURL = await getDownloadURL(avatarRef);
				await updateDoc(getUserRef(await auth.getUid()), {
					'info.photoURL': avatarURL
				});
			}
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const updateUserdata = async ({ displayName, gender, photoURL, phoneNumber, birthday_date }: Partial<UserInfo>) => {
		try {
			await updateDoc(getUserRef(await auth.getUid()), {
				'info.displayName': displayName || userdata.value?.info?.displayName || null,
				'info.phoneNumber': phoneNumber || userdata.value?.info?.phoneNumber || null,
				'info.birthday_date': birthday_date || userdata.value?.info?.birthday_date || null,
				'info.gender': gender || 'unknown',
				'info.photoURL': photoURL || userdata.value?.info?.photoURL || null
			});
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const fetchAuthUserdata = async () => {
		try {
			const userRef = getUserRef(await auth.getUid());
			const unsubscribe = onSnapshot(userRef, udata => {
				if (udata && udata.exists()) {
					const { info, ...data } = udata.data() as UserData;
					const { birthday_date, ...rest } = info as UserInfo;
					setUserData({
						...data,
						info: {
							...rest,
							birthday_date: birthday_date instanceof Timestamp ? birthday_date.toDate() : birthday_date
						}
					});
				}
			});
			return unsubscribe;
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const getUserdataById = async (uid: FirebaseUser['uid']) => {
		try {
			const udata = await getDoc(getUserRef(uid));
			if (udata && udata.exists()) {
				return udata.data() as UserData;
			}
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const addToFriend = async (uid: UserInfo['uid']) => {
		try {
			await updateDoc(getUserRef(await auth.getUid()), {
				friendsUid: arrayUnion(uid)
			});
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	return {
		userdata,
		clearData,
		setUserInfo,
		setUserData,
		createUser,
		getUserRef,
		updateUserAvatar,
		updateUserdata,
		fetchAuthUserdata,
		getUserdataById,
		addToFriend
	};
});
