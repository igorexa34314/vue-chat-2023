/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
import { GlobalComponents } from 'vue';

declare module 'vue' {
	export interface GlobalComponents {
		PageLoader: typeof PageLoader;
	}
}
