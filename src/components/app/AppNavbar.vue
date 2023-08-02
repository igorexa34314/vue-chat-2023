<template>
	<v-app-bar color="blue-grey-darken-4" :elevation="7" style="overflow: visible;">
		<v-app-bar-nav-icon variant="text" @click.stop="emit('drawer')"></v-app-bar-nav-icon>

		<v-toolbar-title>My chat</v-toolbar-title>

		<v-spacer></v-spacer>

		<v-fade-transition>
			<SearchBox v-show="searchState.enabled" ref="searchEl" @blur="searchState.enabled = false" />
		</v-fade-transition>

		<v-btn variant="text" :icon="mdiMagnify" @click="enableSearch" />

		<v-btn variant="text" :icon="mdiFilter" disabled />

		<v-menu draggable="false" width="150px">
			<template #activator="{ props }">
				<v-btn v-bind="props" variant="text" :icon="mdiDotsVertical" />
			</template>
			<v-list density="compact">
				<v-list-item density="compact" to="/profile" draggable="false">
					<template #prepend>
						<v-icon :icon="mdiAccountCircleOutline" class="mr-6" />
					</template>
					<v-list-item-title>Profile</v-list-item-title>
				</v-list-item>
				<v-list-item density="compact" @click="exit" draggable="false">
					<template #prepend>
						<v-icon :icon="mdiLogout" class="mr-6" />
					</template>
					<v-list-item-title>Logout</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>
	</v-app-bar>
</template>

<script setup lang="ts">
import SearchBox from '@/components/UI/SearchBox.vue';
import { mdiMagnify, mdiFilter, mdiDotsVertical, mdiAccountCircleOutline, mdiLogout } from '@mdi/js';
import messages from '@/utils/messages.json';
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { logout } from '@/services/auth';
import { useSnackbarStore } from '@/stores/snackbar';

const { push } = useRouter();
const { showMessage } = useSnackbarStore();

const emit = defineEmits<{
	drawer: []
}>();

const searchEl = ref<InstanceType<typeof SearchBox>>();
const searchState = ref({
	enabled: false,
	text: ''
});

const enableSearch = () => {
	searchState.value.enabled = true;
	nextTick(() => {
		searchEl.value?.$el?.focus()
	});
};
const exit = async () => {
	try {
		await logout();
	} catch (e) {
		showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
	}
	push('/login');
};
</script>
