<template>
	<v-menu
		v-model="showMenu"
		v-bind="{
			offset,
			minWidth,
			maxWidth,
			zIndex,
		}">
		<template #activator="{ props, isActive }">
			<slot name="activator" v-bind="{ props, isActive }"></slot>
		</template>
		<v-list density="compact">
			<v-list-item
				v-for="item of contextMenuItems"
				:key="item.value"
				@click="emit(item.value as any)"
				style="cursor: pointer"
				class="w-100">
				<template #prepend>
					<v-icon :icon="item.icon" :class="item.colorClass || ''" />
				</template>
				<template #title>
					<div class="ml-4" :class="item.colorClass || ''">{{ item.title }}</div>
				</template>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script setup lang="ts">
import { VMenu } from 'vuetify/components';
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
// import { ContextMenu, ContextMenuItem } from '@imengyu/vue3-context-menu';
// import { MenuOptions } from '@imengyu/vue3-context-menu/lib/ContextMenuDefine';
import { MessageContent } from '@/services/message';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css';

const props = withDefaults(
	defineProps<{
		contentType?: MessageContent['type'];
		modelValue?: VMenu['modelValue'];
		maxWidth?: VMenu['maxWidth'];
		minWidth?: VMenu['minWidth'];
		offset?: VMenu['offset'];
		zIndex?: VMenu['zIndex'];
	}>(),
	{
		modelValue: false,
		contentType: 'text',
		maxWidth: 400,
		minWidth: 200,
		zIndex: 100,
		offset: () => [0, 0],
	}
);

const emit = defineEmits<{
	'update:modelValue': [val: boolean];
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
