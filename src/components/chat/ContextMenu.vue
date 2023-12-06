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
			v-bind="{ disabled: item.disabled }"
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
import { ContextMenu, ContextMenuItem } from '@imengyu/vue3-context-menu';
import type { MenuOptions } from '@imengyu/vue3-context-menu/lib/ContextMenuDefine';
import type { MessageContent } from '@/services/message';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css';

const {
	contentType = 'text',
	self = true,
	maxWidth = 400,
	minWidth = 200,
	zIndex = 100,
	offset = [20, 30],
	theme = 'dark',
	position = { x: 0, y: 0 },
} = defineProps<{
	contentType?: MessageContent['type'];
	self?: boolean;
	maxWidth?: MenuOptions['maxWidth'];
	minWidth?: MenuOptions['minWidth'];
	position?: { x: MenuOptions['x']; y: MenuOptions['y'] };
	offset?: [MenuOptions['xOffset'], MenuOptions['yOffset']];
	theme?: MenuOptions['theme'];
	zIndex?: MenuOptions['zIndex'];
}>();

const emit = defineEmits<{
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

const showMenu = defineModel<boolean>('modelValue', { default: false });

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

const contextMenuItems = computed(
	() =>
		[
			{ title: 'Reply', value: 'reply', icon: mdiReplyOutline, disabled: true },
			self ? { title: 'Edit', value: 'edit', icon: mdiPencil } : false,
			{ title: 'Pin', value: 'pin', icon: mdiPinOutline, disabled: true },
			selectedText.value
				? { title: 'Copy selected text', value: 'copySelected', icon: mdiContentCopy }
				: contentType === 'text'
				  ? { title: 'Copy text', value: 'copyAll', icon: mdiContentCopy }
				  : contentType === 'media'
				    ? { title: 'Copy image', value: 'copyImage', icon: mdiImage }
				    : { title: 'Copy link', value: 'copyLink', icon: mdiLinkVariant },
			contentType !== 'text' ? { title: 'Download', value: 'download', icon: mdiDownload } : false,
			{ title: 'Forward', value: 'forward', icon: mdiShareOutline, disabled: true },
			{ title: 'Select', value: 'select', icon: mdiCheckCircleOutline, disabled: true },
			self
				? {
						title: 'Delete',
						value: 'delete',
						icon: mdiDeleteOutline,
						colorClass: 'text-deep-orange-accent-3',
				  }
				: false,
		].filter(Boolean) as { title: string; value: string; icon: string; colorClass?: string; disabled?: boolean }[]
);
</script>
