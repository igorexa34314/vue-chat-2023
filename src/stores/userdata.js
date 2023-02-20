import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getFirestore, getDoc, setDoc, onSnapshot, doc, updateDoc, arrayUnion, Timestamp, collection } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthStore } from '@/stores/auth';
import { uuidv4 } from '@firebase/util';

export const useUserdataStore = defineStore('userdata', () => {
	const auth = useAuthStore();
	const storage = getStorage();
	const db = getFirestore();
	const usersCol = collection(db, 'userdata');

	const userdata = ref({});

	const clearData = () => {
		userdata.value = {};
	};
	const setUserdata = data => {
		userdata.value = data;
	};
	const getUserRef = async uid => {
		if (uid) {
			return doc(usersCol, uid);
		}
		return doc(usersCol, await auth.getUid());
	};
	const createUser = async ({ uid, displayName, phoneNumber, photoURL, metadata }) => {
		try {
			await setDoc(
				await getUserRef(uid),
				{
					info: {
						uid,
						displayName,
						phoneNumber,
						photoURL,
						gender: 'unknown',
						created_at: Timestamp.fromDate(new Date(metadata.creationTime) || new Date())
						// location: (await navigator.geolocation.getCurrentPosition()) || 'unknown'
					},
					chats: [],
					friends: []
				},
				{ merge: true }
			);
			setUserdata({ uid, displayName, phoneNumber, photoURL, metadata });
		} catch (e) {
			console.error('Error adding document: ', e);
		}
	};
	const updateUserdata = async ({ name, gender, avatar }) => {
		try {
			await updateDoc(await getUserRef(), {
				'info.displayName': name,
				'info.gender': gender
			});
			if (avatar) {
				const avatarRef = storageRef(storage, `userdata/${await getUid()}/avatar/${uuidv4() + '.' + avatar.name.split('.')[avatar.name.split('.').length - 1]}`);
				await uploadBytes(avatarRef, avatar, {
					contentType: avatar.type
				});
				const avatarURL = await getDownloadURL(avatarRef);
				await updateDoc(await getUserRef(), {
					'info.photoURL': avatarURL
				});
			}
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const fetchAuthUserdata = async () => {
		try {
			const infoRef = await getUserRef();
			onSnapshot(infoRef, udata => {
				if (udata && udata.exists()) {
					setUserdata(udata.data().info);
				}
			});
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const getUserdataById = async uid => {
		try {
			const udata = await getDoc(await getUserRef(uid));
			if (udata && udata.exists()) {
				return udata.data().info;
			}
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const addToFriend = async () => {
		try {
			await updateDoc(await getUserRef(), {
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
