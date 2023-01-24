// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

export default defineNuxtPlugin(app => {
	const vuetify = createVuetify({
		components,
		directives,
		ssr: true,
		// add theme
		theme: {
			// defaultTheme: MAIN_THEME,
			// themes: {
			// 	mainTheme,
			// 	mainDarkTheme
			// },
			// // add color variations
			// variations: {
			// 	colors: ['primary', 'secondary'],
			// 	lighten: 3,
			// 	darken: 3
			// }
		},
		// Add the custom iconset
		icons: {
			defaultSet: 'mdi',
			aliases,
			sets: {
				mdi
			}
		}
	});

	app.vueApp.use(vuetify);
});
