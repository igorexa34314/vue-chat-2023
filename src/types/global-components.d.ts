/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
import { GlobalComponents } from 'vue';
import PageLoader from '@/components/UI/PageLoader.vue';

declare module 'vue' {
	export interface GlobalComponents {
		PageLoader: typeof PageLoader;
	}
}
