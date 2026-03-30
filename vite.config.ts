import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import VueRouter from 'unplugin-vue-router/vite';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
	base: '/',
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	plugins: [
		VueRouter({
			routesFolder: 'src/pages',
			dts: './src/types/typed-router.d.ts',
		}),
		vue({
			template: { transformAssetUrls },
		}),
		vuetify({ autoImport: { labs: true } }),
		VueI18nPlugin({
			globalSFCScope: true,
			// you need to set i18n resource including paths!
			include: fileURLToPath(new URL('./src/locales/**', import.meta.url)),
		}),
		vueDevTools(),
		{
			...visualizer({ filename: 'stats.html', open: true }),
			apply: ({ mode }) => mode === 'analyze',
		},
	],
	optimizeDeps: {
		include: [
			'unplugin-vue-router/runtime',
			'base64-arraybuffer',
			'@vueuse/core',
			'uuid',
			'vuetify-birthdaypicker',
			'vue-instantsearch/vue3/es',
			'algoliasearch/lite',
		],
		exclude: ['vuetify'],
	},
});
