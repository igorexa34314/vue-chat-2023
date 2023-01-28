<template>
	<v-layout class="app">
		<v-app-bar color="blue-grey-darken-4" :elevation="7" prominent>

			<v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

			<v-btn variant="text" icon="mdi-arrow-left" @click="exit"></v-btn>

			<v-toolbar-title>Чат комнаты {{ useRequestEvent.room }}</v-toolbar-title>

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
			<slot />
		</v-main>
	</v-layout>
</template>

<script setup>
import { useUsersStore } from '@/stores/users';
const usersStore = useUsersStore();
const user = usersStore.user;

const searchEnabled = ref(false);
const search = ref(null);
const drawer = ref(true);

const enableSearch = () => {
	searchEnabled.value = true;
};
watch(searchEnabled, newVal => { if (newVal) search.value.focus(); });

const exit = () => {
	navigateTo({ path: '/', query: { message: 'leftChat' } });
	usersStore.clearData();
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