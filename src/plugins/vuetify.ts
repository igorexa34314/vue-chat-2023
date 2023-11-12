import { createVuetify } from 'vuetify';

// Icons and styles
import 'vuetify/styles';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';

export default createVuetify({
	theme: {
		defaultTheme: 'dark',
	},
	icons: {
		defaultSet: 'mdi',
		aliases: {
			...aliases,
		},
		sets: {
			mdi,
		},
	},
});
