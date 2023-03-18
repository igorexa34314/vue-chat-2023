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

export const auth = getAuth();

export const fbErrorHandler = (e: unknown, msg?: string) => {
	console.error(msg || '', e);
	throw e instanceof FirebaseError ? e.code : e;
};

export const getUid = async () => {
	const currentUser = await getCurrentUser();
	if (currentUser && currentUser.uid) {
		return currentUser.uid;
	}
	return;
};
export const signInWithGoogle = async () => {
	try {
		const { createUser } = useUserdataStore();
		const provider = new GoogleAuthProvider();
		const user = (await signInWithPopup(auth, provider)).user;
		await createUser(user);
	} catch (e: unknown) {
		fbErrorHandler(e);
	}
};
export const registerWithEmail = async ({ email, password, displayName }: UserCredentials) => {
	try {
		const { createUser } = useUserdataStore();
		const avatarURL = await getDownloadURL(ref(getStorage(), 'assets/default_user_avatar.jpg'));
		const user = (await createUserWithEmailAndPassword(auth, email, password)).user;
		await updateProfile(user, { displayName, photoURL: avatarURL });
		await createUser(user);
		return user.uid;
	} catch (e: unknown) {
		fbErrorHandler(e);
	}
};
export const loginWithEmail = async ({ email, password }: UserCredentials) => {
	try {
		const { createUser } = useUserdataStore();
		await signInWithEmailAndPassword(auth, email, password);
		await createUser((await getCurrentUser()) as FirebaseUser);
	} catch (e: unknown) {
		fbErrorHandler(e);
	}
};
export const logout = async () => {
	try {
		await signOut(auth);
	} catch (e: unknown) {
		fbErrorHandler(e);
	}
};
