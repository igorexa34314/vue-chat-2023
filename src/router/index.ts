import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router/auto';
import { setupLayouts } from 'virtual:generated-layouts';
import { checkAuth } from '@/middlewares/auth';
import { valalidateEnterName } from '@/middlewares/enterName';
import type { RouteNamedMap } from 'vue-router/auto/routes';

const history = import.meta.env.SSR
	? createMemoryHistory(import.meta.env.BASE_URL)
	: createWebHistory(import.meta.env.BASE_URL);

const router = createRouter({
	history,
	extendRoutes: routes => {
		const enterNameRoute = routes.find(route => route.name === '/enter-name');
		if (enterNameRoute) {
			enterNameRoute.beforeEnter = valalidateEnterName;
		}
		const authRoutes: (keyof RouteNamedMap)[] = ['/login', '/register'];
		routes.map(route => {
			if (!authRoutes.includes(route.name as keyof RouteNamedMap)) {
				route.meta = { ...route.meta, auth: true, requiresAuth: true };
			}
			return route;
		});
		return setupLayouts(routes);
	},
});

router.beforeEach(checkAuth);

export default router;
