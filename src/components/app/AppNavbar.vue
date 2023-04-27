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

		<v-btn variant="text" :icon="mdiMagnify" @click="enableSearch" disabled />

		<v-btn variant="text" :icon="mdiFilter" disabled />

		<v-menu draggable="false">
			<template #activator="{ props }">
				<v-btn v-bind="props" variant="text" :icon="mdiDotsVertical" />
			</template>
			<v-list density="compact">
				<v-list-item density="compact" to="/profile" draggable="false">
					<template #prepend>
						<v-icon :icon="mdiAccountCircleOutline" class="mr-6" />
					</template>
					<v-list-item-title>Профиль</v-list-item-title>
				</v-list-item>
				<v-list-item density="compact" @click="exit" draggable="false">
					<template #prepend>
						<v-icon :icon="mdiLogout" class="mr-6" />
					</template>
					<v-list-item-title>Выйти</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>
	</v-app-bar>
</template>

<script setup lang="ts">
import { mdiMagnify, mdiFilter, mdiDotsVertical, mdiAccountCircleOutline, mdiLogout } from '@mdi/js';
import messages from '@/utils/messages.json';
import { reactive, ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { logout } from '@/services/auth';
import { useUserdataStore } from '@/stores/userdata';
import { useSnackbarStore } from '@/stores/snackbar';
import { VTextField } from 'vuetify/components';

const { push } = useRouter();
const { $reset } = useUserdataStore();
const { showMessage } = useSnackbarStore();

const emit = defineEmits<{
	(e: 'drawer'): void;
}>();

const search = ref<VTextField>();
const searchState = reactive({
	enabled: false,
	text: ''
});

const enableSearch = () => {
	searchState.enabled = true;
	// @ts-ignore
	nextTick(() => search.value?.focus());
};
const exit = async () => {
	try {
		await logout();
	} catch (e) {
		showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
	}
	$reset();
	push('/login');
};
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
