import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import App from './App.vue';
import router from '@/router';
import vuetify from '@/plugins/vuetify';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia).use(vuetify).use(router).mount('#app');
