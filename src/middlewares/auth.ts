import { auth } from '@/firebase';
import { NavigationGuardWithThis } from 'vue-router/auto';

export const checkAuth: NavigationGuardWithThis<undefined> = async (to, from, next) => {
	const currentUser = auth.currentUser;

	if (to.meta.auth || to.meta.requiresAuth) {
		if (!currentUser) {
			return next({
				path: '/login',
				query: {
					message: 'needAuth',
				},
			});
		}
	} else if (to.name === 'login' || to.name === 'register') {
		if (currentUser) {
			return next({ path: '/profile' });
		}
	}
	return next();
};
