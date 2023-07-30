import PageLoader from '@/components/UI/PageLoader.vue';

declare module '@vue/runtime-core' {
	export interface GlobalComponents {
		PageLoader: typeof PageLoader;
	}
}
