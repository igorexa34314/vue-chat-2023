import { useUsersStore } from '@/stores/users';

export default defineNuxtRouteMiddleware((to, from) => {
	const usersStore = useUsersStore();
	if (!Object.keys(usersStore.user).length) {
		return navigateTo({ path: '/', query: { message: 'noUser' } });
	}
});
