import { defineConfig, loadEnv } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import vue from '@vitejs/plugin-vue';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import Layouts from 'vite-plugin-vue-layouts';
import Pages from 'vite-plugin-pages';

// https://vitejs.dev/config/
export default ({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return defineConfig({
		appType: 'mpa', // disable history fallback
		base: process.env.VITE_BASE || '/',
		server: {
			port: +process.env.VITE_PORT || 3000
		},
		resolve: {
			alias: {
				'@': resolve(dirname(fileURLToPath(import.meta.url)), './src')
			}
		},
		plugins: [
			vue({ template: { transformAssetUrls } }),
			Pages({
				dirs: 'src/pages',
				exclude: ['**/components/*.vue'],
				extendRoute(route) {
					if (route.path === '/login' || route.path === '/register') {
						return route;
					}
					return {
						...route,
						meta: { auth: true }
					};
				}
			}),
			Layouts({
				layoutsDirs: 'src/layouts',
				defaultLayout: 'default'
			}),
			vuetify(),
			VueI18nPlugin({
				globalSFCScope: true,
				// you need to set i18n resource including paths!
				include: [resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**')]
			})
		],
		define: {
			'process.env.DEBUG': false
		}
	});
};
