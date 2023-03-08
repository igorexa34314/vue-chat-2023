<template>
	<v-app-bar color="blue-grey-darken-4" :elevation="7" prominent>

		<v-app-bar-nav-icon variant="text" @click.stop="emit('drawer')"></v-app-bar-nav-icon>

		<v-toolbar-title>Мой чат</v-toolbar-title>

		<v-spacer></v-spacer>

		<Transition name="append-search">
			<v-text-field v-show="searchState.enabled" v-model="searchState.text" ref="search"
				@blur="searchState.enabled = false" class="mr-3" placeholder="Поиск" variant="solo" density="compact"
				hide-details />
		</Transition>

		<v-btn variant="text" icon="mdi-magnify" @click="enableSearch" disabled />

		<v-btn variant="text" icon="mdi-filter" disabled />

		<v-menu>
			<template v-slot:activator="{ props }">
				<v-btn v-bind="props" variant="text" icon="mdi-dots-vertical" />
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

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/auth';
import { useUserdataStore } from '@/stores/userdata';
import { useSnackbarStore } from '@/stores/snackbar';


const { push } = useRouter();
const { logout } = useAuth();
const { clearData } = useUserdataStore();
const { showMessage } = useSnackbarStore();

const emit = defineEmits<{
	(e: 'drawer'): void,
}>();

const search = ref();
const searchState = reactive({
	enabled: false,
	text: '',
});

const enableSearch = () => {
	searchState.enabled = true;
	setTimeout(() => search.value.focus(), 0);
};
const exit = async () => {
	try {
		await logout();
	} catch (e) {
		showMessage(messages[e] || e, 'red-darken-3', 2000);
	}
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