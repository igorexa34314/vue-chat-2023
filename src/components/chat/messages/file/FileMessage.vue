<template>
	<div v-if="content.files.length" class="file-message__wrapper">
		<p v-if="content.subtitle.length" class="message__subtitle mb-3">{{ content.subtitle }}</p>
		<div v-for="(file, index) in content.files" :key="file.id" :class="{ 'mb-1': index !== (content.files.length - 1) }"
			class="d-flex align-center">
			<v-hover #default="{ isHovering, props: hoverProps }">
				<component :is="file.thumbnail && file.sizes ? FilePreview : FileExtension"
					v-bind="{ file, hoverProps, isHovering, loading: isLoading }" @downloadFile="downloadFile(file)"
					@openFile="emit('openInOverlay', file.id)"
					@loaded="(mediaReady: ImageWithPreviewURL) => emit('mediaLoaded', mediaReady)" />
			</v-hover>
			<div class="file-details ml-2 text-subtitle-1 font-weight-medium">
				<p class="text-subtitle-1" :title="file.fullname">{{ file.fullname }}</p>
				<p class="mt-1 text-body-2">{{ formatFileSize(file.fullsize) }}</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import FileExtension from '@/components/chat/messages/file/FileExtension.vue';
import FilePreview from '@/components/chat/messages/file/FilePreview.vue';
import { ref } from 'vue';
import { formatFileSize } from '@/utils/filters/messages';
import { downloadFile as downloadFileProcess } from '@/utils/message/fileActions';
import type { FileMessage } from '@/stores/messages';
import type { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';


const props = defineProps<{
	content: FileMessage;
}>();

const emit = defineEmits<{
	(e: 'openInOverlay', imgId: ImageWithPreviewURL['id']): void;
	(e: 'mediaLoaded', media: Pick<ImageWithPreviewURL, 'id' | 'previewURL'>): void;
}>();

const isLoading = ref(false);

const downloadFile = async (file: FileMessage['files'][number]) => {
	if (!isLoading.value) {
		try {
			isLoading.value = true;
			await downloadFileProcess(file);
		} catch (e) {
			console.error(e);
		}
		finally {
			isLoading.value = false;
		}
	}
}
</script>

<style lang="scss" scoped>
.file-details {
	max-width: 360px;
	p {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	@media(max-width: 720px) {
		max-width: 320px;
	}
	@media(max-width: 640px) {
		max-width: 280px;
	}
}
</style>