import { defineStore } from 'pinia';

export const useUsersStore = defineStore('users', {
	state: () => ({
		users: []
	}),
	getters: {
		getAllUsers: state => state.users
	},
	actions: {
		addUser(user) {
			this.users.push(user);
		}
	}
});
