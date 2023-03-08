import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router';
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from '~pages';
import { getCurrentUser } from 'vuefire';

const history = import.meta.env.SSR ? createMemoryHistory(import.meta.env.BASE_URL) : createWebHistory(import.meta.env.BASE_URL);

const routes = setupLayouts(generatedRoutes);

const router = createRouter({
	history,
	routes
});

router.beforeEach(async to => {
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
});

export default router;
