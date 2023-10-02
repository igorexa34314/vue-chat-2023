<template>
	<div v-if="content.attachments.length" class="file-message__wrapper">
		<TextMessage v-if="content.text.length" v-bind="{ content }" class="message__subtitle mb-sm-3 mb-1" />

		<div
			v-for="(file, index) in content.attachments"
			:key="file.id"
			:class="{ 'mb-1': index !== content.attachments.length - 1 }"
			class="d-flex align-center">
			<v-hover #default="{ isHovering, props: hoverProps }">
				<component
					:is="file.thumbnail && file.raw.sizes ? FilePreview : FileExtension"
					v-bind="{ file, hoverProps, isHovering, loading: isLoading }"
					@downloadFile="downloadFile(file)"
					@openFile="emit('openInOverlay', file.id)"
					class="file__wrapper"
					:data-attachment-id="file.id" />
			</v-hover>

			<div class="file-details ml-2 text-subtitle-1 font-weight-medium text-truncate">
				<p class="text-subtitle-1 text-truncate" :title="file.fullname">{{ file.fullname }}</p>
				<p class="mt-1 text-body-2 text-truncate">{{ formatFileSize(file.raw.fullsize) }}</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { VHover } from 'vuetify/components';
import TextMessage from '@/components/chat/messages/text/TextMessage.vue';
import FileExtension from '@/components/chat/messages/file/FileExtension.vue';
import FilePreview from '@/components/chat/messages/file/FilePreview.vue';
import { ref } from 'vue';
import { formatFileSize } from '@/utils/filters/messages';
import { downloadFile as downloadFileProcess } from '@/utils/message/fileActions';
import { MessageAttachment, MessageContent } from '@/services/message';

const props = defineProps<{
	content: MessageContent<'file'>;
}>();

const emit = defineEmits<{
	openInOverlay: [imgId: MessageAttachment<'media'>['id']];
	// mediaLoaded: [media: { id: MessageAttachment<'media'>['id']; previewURL: MessageAttachment<'media'>['raw']['previewURL'] }]
}>();

const isLoading = ref(false);

const downloadFile = async (file: MessageAttachment) => {
	if (!isLoading.value) {
		try {
			isLoading.value = true;
			await downloadFileProcess(file);
		} catch (e) {
			console.error(e);
		} finally {
			isLoading.value = false;
		}
	}
};
</script>

<style lang="scss" scoped>
.file-details {
	max-width: 360px;
	@media (max-width: 720px) {
		max-width: 320px;
	}
	@media (max-width: 640px) {
		max-width: 280px;
	}
}
</style>
