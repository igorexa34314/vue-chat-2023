<template>
	<v-menu>
		<template #activator="{ props }">
			<v-icon icon="mdi-attachment mdi-rotate-135" v-bind="props" size="large" class="mr-2" />
		</template>
		<v-list density="compact">
			<v-list-item v-for="item in attachMenuItems" :key="item.attachmentType" style="cursor: pointer; padding: 0;"
				class="add-attachment">
				<label :for="item.attachmentType" style="cursor: pointer; display: block; padding: 4px 16px;">
					<v-icon :icon="item.icon" class="mr-4"></v-icon>
					<span>{{ item.title }}</span>
					<input :id="item.attachmentType" type="file" :accept="item.accept" style="display:none;"
						@change="$emit('attach-file', item.attachmentType, $event)" multiple>
				</label>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script setup lang="ts">
import type { Message } from '@/types/db/MessagesTable';

const emit = defineEmits<{
	(e: 'attach-file', type: Exclude<Message['type'], 'text'>, event: Event): void
}>();

const attachMenuItems = [
	{ title: 'Фото или видео', icon: 'mdi-image', attachmentType: 'media', accept: 'image/*, video/*' },
	{ title: 'Файл', icon: 'mdi-file-document-outline', attachmentType: 'file', accept: '.txt,.pdf,.doc,.docx' },
];
</script>

<style lang="scss" scoped>
.add-attachment {
	transition: all .1s ease-in 0s;
	&:hover {
		background-color: rgba(255, 255, 255, 0.12);
	}
}
</style>