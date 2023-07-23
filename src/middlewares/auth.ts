import { getCurrentUser } from 'vuefire';
import { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';

export const checkAuth = async (to: RouteLocationNormalized) => {
	if (to.meta.requiresAuth) {
		const currentUser = await getCurrentUser();
		if (!currentUser) {
			return {
				path: '/login',
				query: {
					message: 'needAuth'
				}
			};
		}
	} else if (to.path === '/login' || to.path === '/register') {
		const currentUser = await getCurrentUser();
		if (currentUser) {
			return '/profile';
		}
	}
	return;
};
