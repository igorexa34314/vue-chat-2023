<template>
	<v-menu ref="ctxMenu" :activator="activator" transition="scale-transition" max-width="400"
		:contentProps="{ style: { top: `${position?.y}px`, left: `${position?.x}px` } }">
		<template #activator="{ props, isActive }">
			<slot name="activator" v-bind="{ props, isActive }"></slot>
		</template>
		<v-list>
			<v-list-item v-for="item of contextMenuItems" :key="item.value" :title="item.title" />
		</v-list>
	</v-menu>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import type { ComponentPublicInstance } from 'vue';

const props = withDefaults(defineProps<{
	modelValue?: boolean;
	activator?: string | Element | ComponentPublicInstance;
	position?: { x: number | string, y: number | string };
}>(), { modelValue: false });

const emit = defineEmits<{
	(e: 'update:modelValue', val: boolean): void
}>();

const showMenu = useVModel(props, 'modelValue', emit);
const contextMenuItems = [
	{ title: 'Переслать', value: 'forward', icon: '' },
	{ title: 'Переслать', value: 'forward', icon: '' },
	{ title: 'Переслать', value: 'forward', icon: '' },
	{ title: 'Переслать', value: 'forward', icon: '' },
];
</script>

<style scoped></style>