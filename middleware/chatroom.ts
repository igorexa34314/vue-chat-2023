import { useUsersStore } from '@/stores/users';

export default defineNuxtRouteMiddleware((to, from) => {
	if (!Object.keys(useUsersStore().user).length) {
		navigateTo({ path: '/', query: { message: 'noUser' } });
	}
});
