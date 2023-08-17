import { defineConfig, loadEnv } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import vue from '@vitejs/plugin-vue';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import VueRouter from 'unplugin-vue-router/vite';
import Layouts from 'vite-plugin-vue-layouts';

// https://vitejs.dev/config/
export default ({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return defineConfig({
		appType: 'mpa', // disable history fallback
		base: process.env.VITE_BASE || '/',
		server: {
			port: +process.env.VITE_PORT || 3000,
		},
		resolve: {
			alias: {
				'@': resolve(dirname(fileURLToPath(import.meta.url)), './src'),
			},
		},
		plugins: [
			vue({ template: { transformAssetUrls } }),
			VueRouter({
				routesFolder: 'src/pages',
				exclude: ['**/components/*.vue'],
				dts: './src/typed-router.d.ts',
			}),
			Layouts({
				layoutsDirs: 'src/layouts',
				defaultLayout: 'default',
			}),
			vuetify(),
			VueI18nPlugin({
				globalSFCScope: true,
				// you need to set i18n resource including paths!
				include: [resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**')],
			}),
		],
		define: {
			'process.env.DEBUG': false,
		},
	});
};
