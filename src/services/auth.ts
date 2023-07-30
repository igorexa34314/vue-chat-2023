import {
	getAuth,
	signOut,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	updateProfile,
	signInWithPopup,
	GoogleAuthProvider
} from 'firebase/auth';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { getCurrentUser } from 'vuefire';
import { createUser } from '@/services/user';
import { fbErrorHandler } from '@/services/errorHandler';
import { User as FirebaseUser } from 'firebase/auth';

interface UserCredentials {
	email: string;
	password: string;
	displayName?: string;
}

export const auth = getAuth();

export const getUid = async () => {
	const currentUser = await getCurrentUser();
	if (currentUser && currentUser.uid) {
		return currentUser.uid;
	}
	return;
};
export const signInWithGoogle = async () => {
	try {
		const provider = new GoogleAuthProvider();
		const user = (await signInWithPopup(auth, provider)).user;
		await createUser(user);
	} catch (e) {
		fbErrorHandler(e);
	}
};
export const registerWithEmail = async ({ email, password, displayName }: UserCredentials) => {
	try {
		const avatarURL = await getDownloadURL(ref(getStorage(), 'assets/default_user_avatar.jpg'));
		const user = (await createUserWithEmailAndPassword(auth, email, password)).user;
		await updateProfile(user, { displayName, photoURL: avatarURL });
		await createUser(user);
		return user.uid;
	} catch (e) {
		fbErrorHandler(e);
	}
};
export const loginWithEmail = async ({ email, password }: UserCredentials) => {
	try {
		await signInWithEmailAndPassword(auth, email, password);
		await createUser((await getCurrentUser()) as FirebaseUser);
	} catch (e) {
		fbErrorHandler(e);
	}
};
export const logout = async () => {
	try {
		await signOut(auth);
	} catch (e) {
		fbErrorHandler(e);
	}
};
