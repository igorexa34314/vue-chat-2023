<template>
	<v-app-bar color="blue-grey-darken-4" :elevation="7" prominent>

		<v-app-bar-nav-icon variant="text" @click.stop="$emit('drawer')"></v-app-bar-nav-icon>

		<v-toolbar-title>Чат комнаты</v-toolbar-title>

		<v-spacer></v-spacer>

		<Transition name="append-search">
			<v-text-field v-show="searchEnabled" ref="search" @blur="searchEnabled = false" class="mr-3" placeholder="Поиск"
				variant="solo" density="compact" hide-details />
		</Transition>

		<v-btn variant="text" icon="mdi-magnify" @click="searchEnabled = true"></v-btn>

		<v-btn variant="text" icon="mdi-filter"></v-btn>

		<v-menu>
			<template v-slot:activator="{ props }">
				<v-btn v-bind="props" variant="text" icon="mdi-dots-vertical"></v-btn>
			</template>
			<v-list density="compact">
				<v-list-item density="compact" to="/profile">
					<template v-slot:prepend>
						<v-icon icon="mdi-account-circle-outline" class="mr-6" />
					</template>
					<v-list-item-title>Профиль</v-list-item-title>
				</v-list-item>
				<v-list-item density="compact" @click="exit">
					<template v-slot:prepend>
						<v-icon icon="mdi-logout" class="mr-6" />
					</template>
					<v-list-item-title>Выйти</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>
	</v-app-bar>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUserdataStore } from '@/stores/userdata';

const { push } = useRouter();
const { logout } = useAuthStore();
const { clearData } = useUserdataStore();

const emit = defineEmits(['drawer']);

const searchEnabled = ref(false);
const search = ref();

watch(searchEnabled, newVal => !!newVal ? search.value.focus() : '');

const exit = async () => {
	await logout();
	clearData();
	push('/login');
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