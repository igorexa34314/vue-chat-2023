import { getCurrentUser } from '@/services/auth';
import type { NavigationGuard } from 'vue-router';

export const checkAuth: NavigationGuard = async to => {
	const currentUser = await getCurrentUser();
	const requireAuth = to.matched.some(record => record.meta.auth || record.meta.requiresAuth);
	if (requireAuth && !currentUser) {
		return { path: '/login', query: { message: 'needAuth' } };
	} else if (!requireAuth && currentUser) {
		return '/profile';
	}
};
