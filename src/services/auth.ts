import {
	signOut,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	updateProfile,
	signInWithPopup,
	GoogleAuthProvider,
} from 'firebase/auth';
import { auth, storage } from '@/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { createUser } from '@/services/user';
import { fbErrorHandler } from '@/services/errorHandler';

interface UserCredentials {
	email: string;
	password: string;
	displayName?: string;
}

export const getUid = async () => {
	const currentUser = auth.currentUser;
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
		const avatarURL = await getDownloadURL(ref(storage, 'assets/default_user_avatar.jpg'));
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
		if (auth.currentUser) {
			await createUser(auth.currentUser);
		}
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
