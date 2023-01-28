import { defineStore } from 'pinia';

export const useUsersStore = defineStore('users', {
	state: () => ({
		user: {}
	}),
	getters: {
		getAllUsers: state => state.users
	},
	actions: {
		clearData() {
			this.user = {};
		},
		setUser(user) {
			this.user = user;
		}
	}
});
