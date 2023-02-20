import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import vueI18n from '@intlify/vite-plugin-vue-i18n';
import Layouts from 'vite-plugin-vue-layouts';
import Pages from 'vite-plugin-pages';

import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		port: 3000
	},
	resolve: {
		alias: {
			'@': resolve(dirname(fileURLToPath(import.meta.url)), './src')
		}
	},
	plugins: [
		Pages({
			exclude: ['**/components/*.vue']
		}),
		Layouts({
			layoutsDirs: 'src/layouts',
			defaultLayout: 'default'
		}),
		vue(),
		vuetify(),
		vueI18n({
			// you need to set i18n resource including paths !
			include: resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**')
		})
	],
	define: {
		'process.env.DEBUG': false
	}
});
