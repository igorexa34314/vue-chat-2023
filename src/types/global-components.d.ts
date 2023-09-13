/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
import PageLoader from '@/components/UI/PageLoader.vue';

declare module 'vue' {
	export interface GlobalComponents {
		PageLoader: typeof PageLoader;
	}
}
