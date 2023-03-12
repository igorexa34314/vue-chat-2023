import { useUserdataStore } from '@/stores/userdata';
import { FirebaseError } from 'firebase/app';
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { getCurrentUser } from 'vuefire';
import type { User as FirebaseUser } from 'firebase/auth';

interface UserCredentials {
	email: string;
	password: string;
	displayName?: string;
}
export const useAuth = () => {
	const userdata = useUserdataStore();
	const auth = getAuth();

	const getUid = async () => {
		const currentUser = await getCurrentUser();
		if (currentUser && currentUser.uid) {
			return currentUser.uid;
		}
		return;
	};
	const signInWithGoogle = async () => {
		try {
			const provider = new GoogleAuthProvider();
			const user = (await signInWithPopup(auth, provider)).user;
			await userdata.createUser(user);
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const registerWithEmail = async ({ email, password, displayName }: UserCredentials) => {
		try {
			const avatarURL = await getDownloadURL(ref(getStorage(), 'assets/default_user_avatar.jpg'));
			const user = (await createUserWithEmailAndPassword(auth, email, password)).user;
			await updateProfile(user, { displayName, photoURL: avatarURL });
			await userdata.createUser(user);
			return user.uid;
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const loginWithEmail = async ({ email, password }: UserCredentials) => {
		try {
			await signInWithEmailAndPassword(auth, email, password);
			await userdata.createUser((await getCurrentUser()) as FirebaseUser);
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	const logout = async () => {
		try {
			await signOut(auth);
		} catch (e: unknown) {
			console.error(e);
			throw e instanceof FirebaseError ? e.code : e;
		}
	};
	return {
		getUid,
		signInWithGoogle,
		registerWithEmail,
		loginWithEmail,
		logout
	};
};
