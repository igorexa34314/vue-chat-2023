import {
	signOut,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	GoogleAuthProvider,
	signInWithRedirect,
	getRedirectResult,
	onAuthStateChanged,
	type ErrorFn,
	type User,
	type AuthProvider,
} from 'firebase/auth';
import { auth } from '@/firebase';
import { fbErrorHandler } from '@/utils/errorHandler';

interface UserCredentials {
	email: string;
	password: string;
}

let currentUser: User | null = null;

export function getCurrentUser() {
	return new Promise((resolve: (user: typeof currentUser) => void, reject: ErrorFn) => {
		if (currentUser) {
			resolve(currentUser);
		} else {
			const unsubscribe = onAuthStateChanged(
				auth,
				user => {
					unsubscribe();
					currentUser = user;
					resolve(currentUser);
				},
				reject
			);
		}
	});
}

export async function getUid() {
	const user = await getCurrentUser();
	if (!user) {
		throw new Error('User unauthenticated');
	}
	return user.uid;
}

export async function signInWithGoogle() {
	try {
		const user = await signInWithProvider(new GoogleAuthProvider());
		return user;
	} catch (e) {
		return fbErrorHandler(e);
	}
}

export async function handleRedirectResult() {
	const result = await getRedirectResult(auth);
	if (result?.user) {
		currentUser = result.user;
	}
}

async function signInWithProvider(provider: AuthProvider) {
	return signInWithRedirect(auth, provider);
}

export async function registerWithEmail({ email, password }: UserCredentials) {
	try {
		const user = (await createUserWithEmailAndPassword(auth, email, password)).user;
		return user;
	} catch (e) {
		return fbErrorHandler(e);
	}
}

export async function loginWithEmail({ email, password }: UserCredentials) {
	try {
		const creds = await signInWithEmailAndPassword(auth, email, password);
		return creds.user;
	} catch (e) {
		return fbErrorHandler(e);
	}
}

export async function logout() {
	try {
		await signOut(auth);
		currentUser = null;
	} catch (e) {
		return fbErrorHandler(e);
	}
}
