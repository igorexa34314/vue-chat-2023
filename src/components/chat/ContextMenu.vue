<template>
	<context-menu v-model:show="showMenu" @close="emit('closed')"
		:options="{ x: +position?.x, y: +position?.y, maxWidth: +maxWidth, zIndex: +zIndex, theme, xOffset: offset[0], yOffset: offset[1] }">
		<context-menu-item v-for="item of contextMenuItems" :key="item.value" @click="emit(item.value)"
			style="cursor: pointer;">
			<template #icon>
				<svg-icon type="mdi" :path="item.icon" :class="item.colorClass || ''" />
			</template>
			<template #label>
				<div class="ml-4" :class="item.colorClass || ''">{{ item.title }}</div>
			</template>
		</context-menu-item>
	</context-menu>
</template>

<script setup lang="ts">
//@ts-nocheck
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiReplyOutline, mdiPencil, mdiPinOutline, mdiContentCopy, mdiImage, mdiDownload, mdiCheckCircleOutline, mdiDeleteOutline, mdiLinkVariant } from '@mdi/js';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useVModel } from '@vueuse/core';
import { ContextMenu, ContextMenuItem } from '@imengyu/vue3-context-menu';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css';
import type { MenuOptions } from '@imengyu/vue3-context-menu/lib/ContextMenuDefine';
import type { Message } from '@/stores/messages';

const props = withDefaults(defineProps<{
	modelValue?: boolean;
	contentType?: Message['type'];
	maxWidth?: MenuOptions['maxWidth'] | string | number;
	position?: { x: MenuOptions['x'] | string | number, y: MenuOptions['y'] | string | number };
	offset?: [MenuOptions['xOffset'] | number, MenuOptions['yOffset'] | number];
	theme?: MenuOptions['theme'];
	zIndex?: MenuOptions['zIndex'] | string | number;
}>(), {
	modelValue: false,
	contentType: 'text',
	maxWidth: '400',
	zIndex: '100',
	offset: () => ([20, 30]),
	theme: 'dark',
	position: () => ({ x: 0, y: 0 })
});

const emit = defineEmits<{
	(e: 'update:modelValue', val: boolean): void;
	(e: 'closed'): void;
	(e: 'forward'): void;
	(e: 'edit'): void;
	(e: 'pin'): void;
	(e: 'copySelected'): void;
	(e: 'copyAll'): void;
	(e: 'copyImage'): void;
	(e: 'copyLink'): void;
	(e: 'download'): void;
	(e: 'select'): void;
	(e: 'delete'): void;
}>();
const selectedText = ref('');
const getSelectionText = () => {
	selectedText.value = getSelection?.().toString() || '';
};
onMounted(() => {
	document.addEventListener('selectionchange', getSelectionText);
});
const showMenu = useVModel(props, 'modelValue', emit);
const contextMenuItems = computed(() => ([
	{ title: 'Переслать', value: 'forward', icon: mdiReplyOutline },
	{ title: 'Изменить', value: 'edit', icon: mdiPencil },
	{ title: 'Закрепить', value: 'pin', icon: mdiPinOutline },
	selectedText.value ? { title: 'Скопировать выделенный текст', value: 'copySelected', icon: mdiContentCopy } :
		props.contentType === 'text' ?
			{ title: 'Скопировать текст', value: 'copyAll', icon: mdiContentCopy } :
			props.contentType === 'media' ?
				{ title: 'Скопировать изображение', value: 'copyImage', icon: mdiImage } :
				{ title: 'Скопировать ссылку', value: 'copyLink', icon: mdiLinkVariant },
	props.contentType !== 'text' ? { title: 'Скачать', value: 'download', icon: mdiDownload } : false,
	{ title: 'Выбрать', value: 'select', icon: mdiCheckCircleOutline },
	{ title: 'Удалить', value: 'delete', icon: mdiDeleteOutline, colorClass: 'text-red-darken-4' },
].filter(Boolean)));
onUnmounted(() => {
	document.removeEventListener('selectionchange', getSelectionText);
});
</script>

<style lang="scss" scoped></style>