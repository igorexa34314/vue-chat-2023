import {
	ErrorFn,
	User,
	signOut,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	updateProfile,
	GoogleAuthProvider,
	signInWithRedirect,
	getRedirectResult,
	onAuthStateChanged,
} from 'firebase/auth';
import { auth, storage } from '@/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { UserService } from '@/services/user';
import { fbErrorHandler } from '@/utils/errorHandler';

interface UserCredentials {
	email: string;
	password: string;
	displayName?: string;
}

export class AuthService {
	static getCurrentUser() {
		return new Promise((resolve: (user: User | null) => void, reject: ErrorFn) => {
			const unsubscribe = onAuthStateChanged(
				auth,
				user => {
					unsubscribe();
					resolve(user);
				},
				reject
			);
		});
	}

	static async getUid() {
		const user = await AuthService.getCurrentUser();
		if (!user || !user.uid) {
			throw new Error('User unauthenticated');
		}
		return user.uid;
	}

	static async signInWithGoogle() {
		try {
			const user = await this.signInWithProvider(new GoogleAuthProvider());
			await UserService.createUser(user);
		} catch (e) {
			fbErrorHandler(e);
		}
	}

	private static async signInWithProvider(provider: any) {
		await signInWithRedirect(auth, provider);
		// After the page redirects back
		const creds = await getRedirectResult(auth);
		if (!creds) {
			throw new Error('User unauthenticated');
		}
		// await sendEmailVerification(creds.user);
		await UserService.createUser(creds.user);
		return creds.user;
	}

	static async registerWithEmail({ email, password, displayName }: UserCredentials) {
		try {
			const avatarURL = await getDownloadURL(ref(storage, 'assets/default_user_avatar.jpg'));
			const user = (await createUserWithEmailAndPassword(auth, email, password)).user;
			await updateProfile(user, { displayName, photoURL: avatarURL });
			await UserService.createUser(user);
			return user.uid;
		} catch (e) {
			fbErrorHandler(e);
		}
	}

	static async loginWithEmail({ email, password }: UserCredentials) {
		try {
			await signInWithEmailAndPassword(auth, email, password);
			if (auth.currentUser) {
				await UserService.createUser(auth.currentUser);
			}
		} catch (e) {
			fbErrorHandler(e);
		}
	}

	static async logout() {
		try {
			await signOut(auth);
		} catch (e) {
			fbErrorHandler(e);
		}
	}
}
