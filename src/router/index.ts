import { createRouter, createWebHistory } from 'vue-router';
import { checkAuth } from '@/middleware/auth';
import { valalidateEnterName } from '@/middleware/enterName';
import { routes, handleHotUpdate } from 'vue-router/auto-routes';

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

router.beforeEach(checkAuth);
router.beforeEach(valalidateEnterName);

if (import.meta.hot) {
	handleHotUpdate(router);
}

export default router;

declare module 'vue-router' {
	export interface RouteMeta {
		requiresAuth?: boolean;
		auth?: boolean;
	}
}
