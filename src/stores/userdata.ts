import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getFirestore, getDoc, setDoc, onSnapshot, doc, updateDoc, arrayUnion, Timestamp, collection } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/composables/auth';
import { useChat } from '@/composables/chat';
import { uuidv4 } from '@firebase/util';

export type Gender = 'unknown' | 'male' | 'female';
export interface UserData {
	chats: Array<string>;
	friends: Array<string>;
	info: object;
}

export interface UserInfo {
	id: string;
	displayName: string;
	photoURL: string;
	created_at: Date;
	birthdayDate?: Date | string;
	gender: Gender;
}

export const useUserdataStore = defineStore('userdata', () => {
	const auth = useAuth();
	const { createSelfChat } = useChat();
	const storage = getStorage();
	const db = getFirestore();
	const usersCol = collection(db, 'userdata');

	const userdata = ref<UserData>(null);

	const clearData = () => {
		userdata.value = null;
	};
	const setUserdata = data => {
		userdata.value = data;
	};
	const getUserRef = uid => (uid ? doc(usersCol, uid) : null);

	const createUser = async ({ uid, displayName, phoneNumber, photoURL, metadata }) => {
		try {
			const userRef = getUserRef(uid);
			const user = await getDoc(userRef);
			if (user.exists()) {
				await updateUserdata({ displayName, avatar: photoURL, phoneNumber });
			} else {
				await setDoc(
					getUserRef(uid),
					{
						info: {
							uid,
							displayName,
							phoneNumber,
							photoURL,
							created_at: Timestamp.fromDate(new Date(metadata.creationTime) || new Date())
							// location: (await navigator.geolocation.getCurrentPosition()) || 'unknown'
						},
						chats: [],
						friends: []
					},
					{ merge: true }
				);
				await createSelfChat(uid);
			}
			setUserdata({ uid, displayName, phoneNumber, photoURL, metadata });
		} catch (e) {
			console.error('Error adding document: ', e);
		}
	};
	const updateUserdata = async ({ displayName, gender, avatar, phoneNumber, birthdayDate }) => {
		try {
			await updateDoc(getUserRef(await auth.getUid()), {
				'info.displayName': displayName || null,
				'info.phoneNumber': phoneNumber || null,
				'info.birthday_date': birthdayDate || null,
				'info.gender': gender || 'unknown'
			});
			if (avatar && avatar.name) {
				const avatarRef = storageRef(storage, `userdata/${await auth.getUid()}/avatar/${uuidv4() + '.' + avatar.name.split('.')[avatar.name.split('.').length - 1]}`);
				await uploadBytes(avatarRef, avatar, {
					name: avatar.name,
					contentType: avatar.type
				});
				const avatarURL = await getDownloadURL(avatarRef);
				await updateDoc(getUserRef(await auth.getUid()), {
					'info.photoURL': avatarURL || null
				});
			}
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const fetchAuthUserdata = async () => {
		try {
			const userRef = getUserRef(await auth.getUid());
			const unsubscribe = onSnapshot(userRef, udata => {
				if (udata && udata.exists()) {
					const { info, ...data } = udata.data();
					const { birthday_date, ...rest } = info;
					setUserdata({
						...data,
						info: {
							...rest,
							birthday_date: birthday_date ? birthday_date.toDate() : null
						}
					});
				}
			});
			return unsubscribe;
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const getUserdataById = async uid => {
		try {
			const udata = await getDoc(getUserRef(uid));
			if (udata && udata.exists()) {
				return udata.data();
			}
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const addToFriend = async () => {
		try {
			await updateDoc(getUserRef(await auth.getUid()), {
				friendsUid: arrayUnion(uid)
			});
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	return {
		userdata,
		clearData,
		setUserdata,
		createUser,
		getUserRef,
		updateUserdata,
		fetchAuthUserdata,
		getUserdataById,
		addToFriend
	};
});
