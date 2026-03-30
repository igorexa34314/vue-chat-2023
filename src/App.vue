<template>
	<GlobalSnackbar />

	<router-view #default="{ Component }">
		<template v-if="Component">
			<Suspense>
				<!-- main content -->
				<component :is="Component" />
				<!-- loading state -->
				<template #fallback>
					<PageLoader />
				</template>
			</Suspense>
		</template>
	</router-view>
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue';
import GlobalSnackbar from '@/components/app/GlobalSnackbar.vue';

const appName = 'My Chat';

useHead({
	titleTemplate: title => (title ? `${title} | ${appName}` : appName),
});
</script>

<style lang="scss">
@use '@/assets/styles/main';

.v-divider {
	--v-border-opacity: 0.6 !important;
}

.no-background-hover:hover {
	background-color: transparent !important;
}
</style>
