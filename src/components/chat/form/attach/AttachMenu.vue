<template>
	<v-menu>
		<template #activator="{ props }">
			<slot name="activator" :props="props"></slot>
		</template>
		<v-list density="compact">
			<v-list-item v-for="item in attachMenuItems" :key="item.attachmentType" style="cursor: pointer; padding: 0;"
				class="add-attachment">
				<label :for="item.attachmentType" style="cursor: pointer; display: block; padding: 4px 16px;">
					<v-icon :icon="item.icon" class="mr-4"></v-icon>
					<span>{{ item.title }}</span>
					<input :id="item.attachmentType" type="file" :accept="item.accept" style="display:none;"
						@change="addFiles(item.attachmentType, $event)" multiple>
				</label>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script setup lang="ts">
import { mdiImage, mdiFileDocumentOutline } from '@mdi/js';
import type { Message } from '@/types/db/MessagesTable';

const props = defineProps<{
	class?: string;
}>();

const emit = defineEmits<{
	(e: 'attach-file', type: Exclude<Message['type'], 'text'>, files: FileList): void
}>();

interface AttachMenu {
	title: string;
	icon: string;
	attachmentType: Exclude<Message['type'], 'text'>;
	accept?: string;
}

const attachMenuItems: AttachMenu[] = [
	{ title: 'Фото или видео', icon: mdiImage, attachmentType: 'media', accept: 'image/*, video/*' },
	{ title: 'Файл', icon: mdiFileDocumentOutline, attachmentType: 'file' },
];
const addFiles = (type: AttachMenu['attachmentType'], e: Event) => {
	const files = (e.target as HTMLInputElement).files;
	if (files && files.length) {
		emit('attach-file', type, files);
	}
};
</script>

<style lang="scss" scoped>
.add-attachment {
	transition: all .1s ease-in 0s;
	&:hover {
		background-color: rgba(255, 255, 255, 0.12);
	}
}
</style>