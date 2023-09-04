<template>
	<v-app-bar color="blue-grey-darken-4" :elevation="7" class="overflow-visible">
		<v-app-bar-nav-icon
			variant="text"
			@click.stop="emit('drawer')"
			:density="!xs ? 'default' : 'comfortable'"
			class="mr-3 mr-sm-0" />

		<v-app-bar-title v-show="!xs || !searchState.enabled" class="app-title text-truncate">My chat</v-app-bar-title>

		<v-spacer />

		<v-fade-transition>
			<SearchBox v-show="searchState.enabled" ref="searchEl" @blur="searchState.enabled = false" />
		</v-fade-transition>

		<v-btn
			v-show="!xs || !searchState.enabled"
			:icon="mdiMagnify"
			@click="enableSearch"
			:density="!xs ? 'default' : 'comfortable'"
			variant="text" />

		<!-- <v-btn :icon="mdiFilter"  variant="text" disabled /> -->

		<v-menu draggable="false" width="100%" max-width="180px">
			<template #activator="{ props }">
				<v-btn
					v-bind="props"
					variant="text"
					:icon="mdiDotsVertical"
					class="mr-2"
					:density="!xs ? 'default' : 'comfortable'" />
			</template>
			<v-list density="compact">
				<v-list-item density="compact" @click="push('/profile')" draggable="false">
					<v-list-item-title>Profile</v-list-item-title>
					<template #prepend>
						<v-icon :icon="mdiAccountCircleOutline" class="mr-6" />
					</template>
				</v-list-item>
				<v-list-item density="compact" @click="exit" draggable="false">
					<v-list-item-title>Logout</v-list-item-title>
					<template #prepend>
						<v-icon :icon="mdiLogout" class="mr-6" />
					</template>
				</v-list-item>
			</v-list>
		</v-menu>
	</v-app-bar>
</template>

<script setup lang="ts">
import { VAppBar, VAppBarNavIcon, VAppBarTitle, VFadeTransition, VMenu } from 'vuetify/components';
import SearchBox from '@/components/UI/SearchBox.vue';
import { mdiMagnify, mdiFilter, mdiDotsVertical, mdiAccountCircleOutline, mdiLogout } from '@mdi/js';
import messages from '@/utils/messages.json';
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router/auto';
import { logout } from '@/services/auth';
import { useSnackbarStore } from '@/stores/snackbar';
import { useDisplay } from 'vuetify';

const { push } = useRouter();
const { showMessage } = useSnackbarStore();

const emit = defineEmits<{
	drawer: [];
}>();

const { xs } = useDisplay();
const searchEl = ref<InstanceType<typeof SearchBox>>();
const searchState = ref({
	enabled: false,
	text: '',
});

const enableSearch = () => {
	searchState.value.enabled = true;
	nextTick(() => {
		searchEl.value?.$el?.focus();
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
