<template>
	<context-menu v-model:show="showMenu"
		:options="{ x: +position?.x, y: +position?.y, maxWidth: +maxWidth, zIndex: +zIndex, theme, xOffset: offset[0], yOffset: offset[1] }">
		<context-menu-item v-for="item of contextMenuItems" :key="item.value" :label="item.title" />
	</context-menu>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import { ContextMenu, ContextMenuItem } from '@imengyu/vue3-context-menu';
import type { MenuOptions } from '@imengyu/vue3-context-menu/lib/ContextMenuDefine';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css';

const props = withDefaults(defineProps<{
	modelValue?: boolean;
	maxWidth?: MenuOptions['maxWidth'] | string | number;
	position?: { x: MenuOptions['x'] | string | number, y: MenuOptions['y'] | string | number };
	offset?: [MenuOptions['xOffset'] | number, MenuOptions['yOffset'] | number];
	theme?: MenuOptions['theme'];
	zIndex?: MenuOptions['zIndex'] | string | number;
}>(), {
	modelValue: false,
	maxWidth: '400',
	zIndex: '100',
	offset: () => ([20, 30]),
	theme: 'dark',
	position: () => ({ x: 0, y: 0 })
});

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