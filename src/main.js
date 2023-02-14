import { createApp } from 'vue';
import { firebaseApp } from '@/firebase';
import { VueFire, VueFireAuth } from 'vuefire';
import { createMetaManager } from 'vue-meta';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import router from '@/router';
import vuetify from '@/plugins/vuetify';

const app = createApp(App);
app.use(VueFire, {
	// imported above but could also just be created here
	firebaseApp,
	modules: [
		// we will see other modules later on
		VueFireAuth()
	]
});

app.use(createPinia()).use(vuetify).use(router).use(createMetaManager()).mount('#app');
