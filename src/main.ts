import { handleRedirectResult } from '@/services/auth';
import { createApp } from 'vue';
import { createHead } from '@unhead/vue';
import pinia from '@/plugins/pinia';
import vueI18n from '@/plugins/i18n';
import App from '@/App.vue';
import router from '@/router';
import vuetify from '@/plugins/vuetify';
import PageLoader from '@/components/UI/PageLoader.vue';

handleRedirectResult().then(() => {
	const app = createApp(App);

	app.use(createHead()).use(router).use(vueI18n).use(vuetify).use(pinia);

	app.component('PageLoader', PageLoader);

	app.mount('#app');
});

// declare module 'vue' {
// 	export interface GlobalComponents {
// 		PageLoader: (typeof import('@/components/UI/PageLoader.vue'))['default'];
// 	}
// }
