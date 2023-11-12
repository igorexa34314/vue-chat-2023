<template>
	<v-app-bar color="blue-grey-darken-4" :elevation="7" class="overflow-visible">
		<v-app-bar-nav-icon
			variant="text"
			@click.stop="emit('drawer')"
			:density="!xs ? 'default' : 'comfortable'"
			class="mr-3 mr-sm-0" />

		<v-app-bar-title v-show="!xs || !searchState.enabled" class="app-title text-truncate">
			<slot v-if="title" name="title">{{ title }}</slot>
			<v-skeleton-loader v-else type="list-item" color="blue-grey-darken-4" max-width="280" />
		</v-app-bar-title>

		<v-spacer />

		<v-fade-transition>
			<SearchBox v-if="searchState.enabled" ref="searchEl" @blur="searchState.enabled = false" />
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
				<v-list-item density="compact" to="/profile" draggable="false">
					<v-list-item-title>Profile</v-list-item-title>
					<template #prepend>
						<v-icon :icon="mdiAccountCircleOutline" class="mr-6" />
					</template>
				</v-list-item>
				<v-list-item density="compact" @click="emit('logout')" draggable="false">
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
import { mdiMagnify, mdiFilter, mdiDotsVertical, mdiAccountCircleOutline, mdiLogout } from '@mdi/js';
import { ref, nextTick, defineAsyncComponent } from 'vue';
import { useDisplay } from 'vuetify';

const SearchBox = defineAsyncComponent(() => import('@/components/UI/SearchBox.vue'));

const { title } = defineProps<{
	title?: string;
}>();

const emit = defineEmits<{
	drawer: [];
	logout: [];
}>();

const slots = defineSlots<{
	title(): any;
}>();

const { xs } = useDisplay();
const searchEl = ref<InstanceType<typeof SearchBox> | null>(null);
const searchState = ref({
	enabled: false,
	text: '',
});

const enableSearch = async () => {
	searchState.value.enabled = true;
	await nextTick();
	searchEl.value?.$el?.focus();
};
</script>
