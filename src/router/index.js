import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router';
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from '~pages';

const baseUrl = import.meta.env.BASE_URL;
const history = import.meta.env.SSR ? createMemoryHistory(baseUrl) : createWebHistory(baseUrl);

const routes = setupLayouts(generatedRoutes);

const router = createRouter({
	history,
	routes
});

export default router;
