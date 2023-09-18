<template>
	<context-menu
		v-model:show="showMenu"
		@close="emit('closed')"
		:options="{
			x: position.x,
			y: position.y,
			zIndex,
			theme,
			xOffset: offset[0],
			yOffset: offset[1],
			minWidth,
			maxWidth,
		}">
		<context-menu-item
			v-for="item of contextMenuItems"
			:key="item.value"
			@click="emit(item.value as any)"
			style="cursor: pointer"
			class="w-100">
			<template #icon>
				<v-icon :icon="item.icon" :class="item.colorClass || ''" />
			</template>
			<template #label>
				<div class="ml-4" :class="item.colorClass || ''">{{ item.title }}</div>
			</template>
		</context-menu-item>
	</context-menu>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
	mdiReplyOutline,
	mdiPencil,
	mdiPinOutline,
	mdiContentCopy,
	mdiImage,
	mdiDownload,
	mdiCheckCircleOutline,
	mdiShareOutline,
	mdiDeleteOutline,
	mdiLinkVariant,
} from '@mdi/js';
import { useVModel } from '@vueuse/core';
import { ContextMenu, ContextMenuItem } from '@imengyu/vue3-context-menu';
import { MenuOptions } from '@imengyu/vue3-context-menu/lib/ContextMenuDefine';
import { MessageContent } from '@/services/message';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css';

const props = withDefaults(
	defineProps<{
		modelValue?: boolean;
		contentType?: MessageContent['type'];
		maxWidth?: MenuOptions['maxWidth'];
		minWidth?: MenuOptions['minWidth'];
		position?: { x: MenuOptions['x']; y: MenuOptions['y'] };
		offset?: [MenuOptions['xOffset'], MenuOptions['yOffset']];
		theme?: MenuOptions['theme'];
		zIndex?: MenuOptions['zIndex'];
	}>(),
	{
		modelValue: false,
		contentType: 'text',
		maxWidth: 400,
		minWidth: 200,
		zIndex: 100,
		offset: () => [20, 30],
		theme: 'dark',
		position: () => ({ x: 0, y: 0 }),
	}
);

const emit = defineEmits<{
	'update:modelValue': [val: boolean];
	closed: [];
	forward: [];
	edit: [];
	pin: [];
	copySelected: [];
	copyAll: [];
	copyImage: [];
	copyLink: [];
	download: [];
	select: [];
	delete: [];
}>();

const selectedText = ref('');
const getSelectionText = () => {
	selectedText.value = getSelection()?.toString() || '';
};
onMounted(() => {
	document.addEventListener('selectionchange', getSelectionText);
});
onUnmounted(() => {
	document.removeEventListener('selectionchange', getSelectionText);
});

const showMenu = useVModel(props, 'modelValue', emit);
const contextMenuItems = computed(
	() =>
		[
			{ title: 'Reply', value: 'reply', icon: mdiReplyOutline },
			{ title: 'Edit', value: 'edit', icon: mdiPencil },
			{ title: 'Pin', value: 'pin', icon: mdiPinOutline },
			selectedText.value
				? { title: 'Copy selected text', value: 'copySelected', icon: mdiContentCopy }
				: props.contentType === 'text'
				? { title: 'Copy text', value: 'copyAll', icon: mdiContentCopy }
				: props.contentType === 'media'
				? { title: 'Copy image', value: 'copyImage', icon: mdiImage }
				: { title: 'Copy link', value: 'copyLink', icon: mdiLinkVariant },
			props.contentType !== 'text' ? { title: 'Скачать', value: 'download', icon: mdiDownload } : false,
			{ title: 'Forward', value: 'forward', icon: mdiShareOutline },
			{ title: 'Select', value: 'select', icon: mdiCheckCircleOutline },
			{ title: 'Delete', value: 'delete', icon: mdiDeleteOutline, colorClass: 'text-deep-orange-accent-3' },
		].filter(Boolean) as { title: string; value: string; icon: string; colorClass?: string }[]
);
</script>
