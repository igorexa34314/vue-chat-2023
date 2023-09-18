import {
	ErrorFn,
	User,
	signOut,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	GoogleAuthProvider,
	signInWithRedirect,
	getRedirectResult,
	onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/firebase';
import { fbErrorHandler } from '@/utils/errorHandler';

interface UserCredentials {
	email: string;
	password: string;
}

let currentUser: User | null = null;

export class AuthService {
	static getCurrentUser() {
		return new Promise((resolve: (user: User | null) => void, reject: ErrorFn) => {
			if (currentUser) {
				resolve(currentUser);
			} else {
				const unsubscribe = onAuthStateChanged(
					auth,
					user => {
						unsubscribe();
						currentUser = user;
						resolve(user);
					},
					reject
				);
			}
		});
	}

	static async getUid() {
		const user = await AuthService.getCurrentUser();
		if (!user) {
			throw new Error('User unauthenticated');
		}
		return user.uid;
	}

	static async signInWithGoogle() {
		try {
			const user = await this.signInWithProvider(new GoogleAuthProvider());
			return user;
		} catch (e) {
			return fbErrorHandler(e);
		}
	}

	static async handleRedirectResult() {
		const result = await getRedirectResult(auth);
		if (result?.user) {
			currentUser = result.user;
		}
	}

	private static async signInWithProvider(provider: any) {
		return signInWithRedirect(auth, provider);
	}

	static async registerWithEmail({ email, password }: UserCredentials) {
		try {
			const user = (await createUserWithEmailAndPassword(auth, email, password)).user;
			return user;
		} catch (e) {
			return fbErrorHandler(e);
		}
	}

	static async loginWithEmail({ email, password }: UserCredentials) {
		try {
			const creds = await signInWithEmailAndPassword(auth, email, password);
			return creds.user;
		} catch (e) {
			return fbErrorHandler(e);
		}
	}

	static async logout() {
		try {
			await signOut(auth);
			currentUser = null;
		} catch (e) {
			return fbErrorHandler(e);
		}
	}
}
