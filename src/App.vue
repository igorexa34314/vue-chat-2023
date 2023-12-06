<template>
	<metainfo>
		<template #title="{ content }: SlotScopeProperties">{{ content ? `${content} | ${AppName}` : AppName }}</template>
	</metainfo>

	<GlobalSnackbar />

	<router-view #default="{ Component }">
		<template v-if="Component">
			<Suspense>
				<!-- main content -->
				<component :is="Component" />
				<!-- loading state -->
				<template #fallback>
					<page-loader />
				</template>
			</Suspense>
		</template>
	</router-view>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import type { SlotScopeProperties } from 'vue-meta';

const GlobalSnackbar = defineAsyncComponent(() => import('@/components/app/GlobalSnackbar.vue'));
const AppName: string = import.meta.env.VITE_APP_NAME || 'My Chat';
</script>

<style lang="scss">
@import '@/assets/styles/main';

.v-divider {
	--v-border-opacity: 0.6 !important;
}

.no-background-hover:hover {
	background-color: transparent !important;
}
</style>
