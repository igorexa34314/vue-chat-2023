import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getFirestore, getDoc, setDoc, onSnapshot, doc, updateDoc, arrayUnion, Timestamp, collection } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/composables/auth';
import { useChat } from '@/composables/chat';
import { uuidv4 } from '@firebase/util';
import { FirebaseError } from '@firebase/util';
import type { UserData, UserInfo } from '@/types/db/UserdataTable';

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

	const createUser = async ({ uid, email, displayName, phoneNumber, photoURL, metadata }: Omit<UserInfo, 'created_at'>) => {
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
	const updateUserdata = async (newData: Partial<UserInfo>) => {
		try {
			// const updateInfoField = (key) => (newData[key] ? { [`info.${key}`]: newData[key] } : undefined);
			const infoField = Object.keys(newData).map(key => ({ [`info.${key}`]: newData[key] }));
			console.log(infoField);
			debugger;
			await updateDoc(getUserRef(await auth.getUid()), {
				// updateInfoField('displayName');
				// 'info.displayName': displayName || null,
				// 'info.phoneNumber': phoneNumber || null,
				// 'info.birthday_date': birthday_date || null,
				// 'info.gender': gender || 'unknown',
				// 'info.photoURL': photoURL || null
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
			return unsubscribe;
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const getUserdataById = async (uid: UserInfo['uid']) => {
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
