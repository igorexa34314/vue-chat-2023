import { defineStore } from 'pinia';

export const useUsersStore = defineStore('users', {
	state: () => ({
		user: {}
	}),
	actions: {
		clearData() {
			this.user = {};
		},
		setUser(user) {
			this.user = user;
		}
	}
});
