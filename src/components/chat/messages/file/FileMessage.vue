<template>
	<div v-if="content.attachments.length" class="file-message__wrapper">
		<TextMessage v-if="content.text.length" v-bind="{ content }" class="message__subtitle mb-3" />
		<div v-for="(file, index) in content.attachments" :key="file.id"
			:class="{ 'mb-1': index !== (content.attachments.length - 1) }" class="d-flex align-center">
			<v-hover #default="{ isHovering, props: hoverProps }">
				<component :is="file.thumbnail && file.raw.sizes ? FilePreview : FileExtension"
					v-bind="{ file, hoverProps, isHovering, loading: isLoading }" @downloadFile="downloadFile(file)"
					@openFile="emit('openInOverlay', file.id)" />
			</v-hover>
			<div class="file-details ml-2 text-subtitle-1 font-weight-medium">
				<p class="text-subtitle-1" :title="file.fullname">{{ file.fullname }}</p>
				<p class="mt-1 text-body-2">{{ formatFileSize(file.raw.fullsize) }}</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import TextMessage from '@/components/chat/messages/text/TextMessage.vue';
import FileExtension from '@/components/chat/messages/file/FileExtension.vue';
import FilePreview from '@/components/chat/messages/file/FilePreview.vue';
import { ref } from 'vue';
import { formatFileSize } from '@/utils/filters/messages';
import { downloadFile as downloadFileProcess } from '@/utils/message/fileActions';
import { Message } from '@/stores/messages';
import { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';


const props = defineProps<{
	content: Message['content'];
}>();

const emit = defineEmits<{
	openInOverlay: [imgId: ImageWithPreviewURL['id']],
	// mediaLoaded: [media: { id: ImageWithPreviewURL['id']; previewURL: ImageWithPreviewURL['raw']['previewURL'] }]
}>();

const isLoading = ref(false);

const downloadFile = async (file: Message['content']['attachments'][number]) => {
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