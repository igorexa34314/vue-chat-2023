import { defineStore } from 'pinia';
import { useUserdataStore } from '@/stores/userdata';
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { getCurrentUser } from 'vuefire';

export const useAuthStore = defineStore('auth', () => {
	const userdata = useUserdataStore();
	const auth = getAuth();

	const getUid = async () => {
		const currentUser = await getCurrentUser();
		if (currentUser.uid) {
			return currentUser.uid;
		}
		return;
	};
	const signInWithGoogle = async () => {
		try {
			const provider = new GoogleAuthProvider();
			const user = (await signInWithPopup(auth, provider)).user;
			await userdata.createUser(user);
		} catch (e) {
			console.error(e);
		}
	};
	const registerWithEmail = async ({ email, password, name }) => {
		try {
			const avatarURL = await getDownloadURL(ref(getStorage(), 'assets/default_user_avatar.jpg'));
			const user = (await createUserWithEmailAndPassword(auth, email, password)).user;
			await updateProfile(user, { displayName: name, photoURL: avatarURL });
			await userdata.createUser(user);
			return user.uid;
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const loginWithEmail = async ({ email, password }) => {
		try {
			await signInWithEmailAndPassword(auth, email, password);
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	const logout = async () => {
		try {
			await signOut(auth);
		} catch (e) {
			console.error(e);
			throw e.code || e;
		}
	};
	return {
		getUid,
		signInWithGoogle,
		registerWithEmail,
		loginWithEmail,
		logout
	};
});
