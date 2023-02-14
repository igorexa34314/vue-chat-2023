import { defineStore } from 'pinia';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

export const useAuthStore = defineStore('auth', {
	state: () => ({
		user: {}
	}),
	actions: {
		clearData() {
			this.user = {};
		},
		setUser(user) {
			this.user = user;
		},
		async register({ email, password, name }) {
			try {
				const auth = getAuth();
				const user = (await createUserWithEmailAndPassword(auth, email, password)).user;
				return user.uid;
			} catch (error) {
				console.error(error);
			}
		}
	}
});
