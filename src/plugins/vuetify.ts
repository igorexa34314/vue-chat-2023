import { createVuetify } from 'vuetify';
import * as VList from 'vuetify/components/VList';
import * as VGrid from 'vuetify/components/VGrid';
import * as VCard from 'vuetify/components/VCard';
import { VBtn, VImg, VIcon, VDivider, VAvatar } from 'vuetify/components';
// import * as directives from 'vuetify/directives';

// Icons and styles
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import 'vuetify/styles';

export default createVuetify({
	components: { ...VList, ...VGrid, ...VCard, VBtn, VImg, VIcon, VDivider, VAvatar },
	directives: {},
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
