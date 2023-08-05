<template>
	<v-menu>
		<template #activator="{ props }">
			<slot name="activator" :props="props"></slot>
		</template>
		<v-list density="compact" class="attach-menu" :width="smAndUp ? '180px' : 'auto'">
			<v-list-item v-for="item in attachMenuItems" :key="item.attachmentType" style="cursor: pointer;"
				class="add-attachment pa-0">
				<label :for="item.attachmentType" style="cursor: pointer;" class="d-block py-1 px-4">
					<v-icon :icon="item.icon" class="mr-4"></v-icon>
					<span>{{ item.title }}</span>
					<input :id="item.attachmentType" type="file" :accept="item.accept" class="d-none"
						@change="addFiles(item.attachmentType, $event)" multiple>
				</label>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script setup lang="ts">
import { mdiImage, mdiFileDocumentOutline } from '@mdi/js';
import { Message } from '@/types/db/MessagesTable';
import { useDisplay } from 'vuetify';

interface AttachMenu {
	title: string;
	icon: string;
	attachmentType: Exclude<Message['type'], 'text'>;
	accept?: string;
}

const emit = defineEmits<{
	'attach-file': [type: Exclude<Message['type'], 'text'>, files: FileList]
}>();

const { smAndUp } = useDisplay();

const attachMenuItems: AttachMenu[] = [
	{ title: 'Media', icon: mdiImage, attachmentType: 'media', accept: 'image/*, video/*' },
	{ title: 'File', icon: mdiFileDocumentOutline, attachmentType: 'file' },
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