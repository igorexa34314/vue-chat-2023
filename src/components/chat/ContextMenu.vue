<template>
	<v-menu
		v-model="showMenu"
		@after-leave="emit('closed')"
		:key="`${Object.values(position).join('-')}`"
		:target="[position.x, position.y]"
		:attach="scrollContainer"
		location-strategy="connected"
		scroll-strategy="close">
		<v-list density="comfortable" v-bind="{ minWidth, maxWidth }">
			<v-list-item
				v-for="item in contextMenuItems"
				:key="item.value"
				@click="$emit(item.value as keyof typeof emit)"
				v-bind="{ disabled: item.inDevelopment }"
				class="w-100">
				<v-list-item-title class="d-flex align-center">
					<v-icon :icon="item.icon" :class="item.color || ''" />
					<div class="ml-4" :class="item.color || ''">{{ item.title }}</div>
				</v-list-item-title>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { contextMenuItems as contextMenuItemsRaw } from '@/constants/chat/message';
import type { VMenu } from 'vuetify/components';
import type { MessageContent } from '@/services/message';

const {
	contentType = 'text',
	self = true,
	maxWidth = 400,
	minWidth = 200,
	position = { x: 0, y: 0 },
	scrollContainer,
	isSelected,
} = defineProps<{
	contentType?: MessageContent['type'];
	self?: boolean;
	maxWidth?: VMenu['maxWidth'];
	minWidth?: VMenu['minWidth'];
	position?: { x: number; y: number };
	scrollContainer?: VMenu['attach'];
	isSelected?: boolean;
}>();

const emit = defineEmits<{
	closed: [];
	forward: [];
	edit: [];
	pin: [];
	copySelectedText: [];
	copyText: [];
	copyImage: [];
	copyLink: [];
	download: [];
	select: [];
	delete: [];
	reply: [];
}>();

const showMenu = defineModel<boolean>();

const contextMenuItems = computed(() => {
	return contextMenuItemsRaw.filter(item => {
		const appliedForItems = Array.isArray(item.appliedFor) ? item.appliedFor : [item.appliedFor];
		return appliedForItems.every(a => {
			switch (a) {
				case 'all':
					return true;
				case 'self':
					return self;
				case 'selection':
					return isSelected;
				case 'text':
					return contentType === 'text' && !isSelected;
				case 'media':
					return contentType === 'media';
				case 'file':
					return contentType === 'file';
				default:
					return true;
			}
		});
	});
});
</script>
