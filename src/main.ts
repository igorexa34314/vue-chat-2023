import { createApp } from 'vue';
import { firebaseApp } from '@/firebase';
import { VueFire, VueFireAuth } from 'vuefire';
import { createMetaManager } from 'vue-meta';
import { createPinia } from 'pinia';
import vueI18n from '@/plugins/vue-i18n';
import App from '@/App.vue';
import router from '@/router';
import vuetify from '@/plugins/vuetify';
import PageLoader from '@/components/UI/PageLoader.vue';

const app = createApp(App);
app.use(VueFire, {
	// imported above but could also just be created here
	firebaseApp,
	modules: [
		// we will see other modules later on
		VueFireAuth()
	]
});
app.component('page-loader', PageLoader);
app.use(vuetify).use(vueI18n).use(router).use(createPinia()).use(createMetaManager()).mount('#app');
