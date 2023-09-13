import { AuthService } from '@/services/auth';
import { createApp } from 'vue';
import { createMetaManager } from 'vue-meta';
import pinia from '@/plugins/pinia';
import vueI18n from '@/plugins/i18n';
import App from '@/App.vue';
import router from '@/router';
import vuetify from '@/plugins/vuetify';
import PageLoader from '@/components/UI/PageLoader.vue';

AuthService.handleRedirectResult().then(() => {
	const app = createApp(App);

	app.component('page-loader', PageLoader);
	app.use(vuetify).use(vueI18n).use(router).use(pinia).use(createMetaManager()).mount('#app');
});
