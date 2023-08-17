import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router';
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from '~pages';
import { checkAuth } from '@/middlewares/auth';

const history = import.meta.env.SSR
	? createMemoryHistory(import.meta.env.BASE_URL)
	: createWebHistory(import.meta.env.BASE_URL);

const routes = setupLayouts(generatedRoutes);

const router = createRouter({
	history,
	routes,
});

router.beforeEach(checkAuth);

export default router;
