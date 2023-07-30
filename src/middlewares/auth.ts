import { getCurrentUser } from 'vuefire';
import { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';

export const checkAuth = async (
	to: RouteLocationNormalized,
	from: RouteLocationNormalized,
	next: NavigationGuardNext
) => {
	if (to.meta.auth || to.meta.requiresAuth) {
		const currentUser = await getCurrentUser();
		if (!currentUser) {
			return next({
				path: '/login',
				query: {
					message: 'needAuth'
				}
			});
		}
	} else if (to.name === 'login' || to.name === 'register') {
		const currentUser = await getCurrentUser();
		if (currentUser) {
			return next({ path: '/profile' });
		}
	}
	return next();
};
