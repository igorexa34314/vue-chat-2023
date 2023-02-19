import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
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
			'@': path.resolve(__dirname, './src')
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
		vuetify()
	],
	define: {
		'process.env.DEBUG': false
	}
});
