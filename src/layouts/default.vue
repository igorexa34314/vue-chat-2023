<template>
	<v-layout class="app">
		<v-app-bar color="blue-grey-darken-4" :elevation="7" prominent>

			<v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

			<v-btn variant="text" icon="mdi-arrow-left" @click="exit"></v-btn>

			<v-toolbar-title>Чат комнаты {{ user.room }}</v-toolbar-title>

			<v-spacer></v-spacer>

			<Transition name="append-search">
				<v-text-field v-show="searchEnabled" ref="search" @blur="searchEnabled = false" class="mr-3"
					placeholder="Поиск" variant="solo" density="compact" hide-details />
			</Transition>

			<v-btn variant="text" icon="mdi-magnify" @click="enableSearch"></v-btn>

			<v-btn variant="text" icon="mdi-filter"></v-btn>

			<v-btn variant="text" icon="mdi-dots-vertical"></v-btn>
		</v-app-bar>

		<NavDrawer v-model="drawer" />

		<v-main>
			<RouterView />
		</v-main>
	</v-layout>
</template>

<script setup>
import NavDrawer from '@/components/NavDrawer.vue';
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserdataStore } from '@/stores/userdata';


const router = useRouter();
const userdataStore = useUserdataStore();

const user = computed(() => userdataStore.userdata);

const searchEnabled = ref(false);
const search = ref(null);
const drawer = ref(true);

const enableSearch = () => {
	searchEnabled.value = true;
};

watch(searchEnabled, newVal => { if (newVal) search.value.focus(); });

const exit = () => {
	router.push({ path: '/', query: { message: 'leftChat' } });
}
</script>

<style lang="scss" scoped>
.append-search-enter-active,
.append-search-leave-active {
	transition: opacity 0.3s ease;
}

.append-search-enter-from,
.append-search-leave-to {
	opacity: 0;
}
</style>