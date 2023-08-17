import { getCurrentUser } from 'vuefire';
import { NavigationGuardWithThis } from 'vue-router/auto';

export const checkAuth: NavigationGuardWithThis<undefined> = async (to, from, next) => {
	if (to.meta.auth || to.meta.requiresAuth) {
		const currentUser = await getCurrentUser();
		if (!currentUser) {
			return next({
				path: '/login',
				query: {
					message: 'needAuth',
				},
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
