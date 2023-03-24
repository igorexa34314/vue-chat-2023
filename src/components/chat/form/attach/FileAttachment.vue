<template>
	<div v-for="file of files" :key="file.id" class="d-flex align-center">

		<div v-if="file.fileData.type.startsWith('image/')" class="file-preview pa-2">
			<v-card height="100%" width="100%" variant="tonal">
				<v-img aspect-ratio="1" ref="imgsEl" :lazy-src="file.thumbnail?.url" :src="file.preview"
					:alt="file.fileData.name" cover>
					<template #placeholder>
						<ImageLoader width="2" size="30" icon-size="16" />
					</template>
				</v-img>
			</v-card>
		</div>

		<div v-else class="file-icon">
			<v-icon icon="mdi-file" size="80px" />
			<span class="file-icon-ext font-weight-black text-brown-darken-4">
				{{ getFileExt(file.fileData.name).length <= 6 ? getFileExt(file.fileData.name) : '' }}</span>
		</div>

		<div class="file-details ml-2 text-subtitle-1 font-weight-medium flex-grow-1">
			<p class="text-subtitle-1">{{ file.fileData.name }}</p>
			<p class="mt-1 text-body-2">{{ formatFileSize(file.fileData.size) }}</p>
		</div>
		<v-btn icon="mdi-trash-can-outline" size="default" variant="text" class="delete-file-btn ml-2"
			@click="emit('deleteAttach', file.id)" />
	</div>
</template>

<script setup lang="ts">
import ImageLoader from '@/components/chat/ImageLoader.vue';
import { ref, computed } from 'vue';
import { formatFileSize, getFileExt } from '@/utils/filters/messages';
import type { VImg } from 'vuetify/components';
import type { AttachedContent } from '@/components/chat/form/attach/AttachDialog.vue';

const props = defineProps<{
	files: AttachedContent
}>();
const emit = defineEmits<{
	(e: 'deleteAttach', imgId: AttachedContent[number]['id']): void
}>();

const getFilePreview = computed(() => {

});

const imgsEl = ref<VImg[]>();
const isFilesReady = computed(() => imgsEl.value?.length ? imgsEl.value?.every(img => img.state === 'loaded') : true);
defineExpose({ isFilesReady });
</script>

<style scoped lang="scss">
.file-details, .file-details p {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
.file-icon {
	position: relative;
	&-ext {
		font-size: 1.1rem;
		display: inline-block;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -30%);
	}
}
.file-preview {
	display: flex;
	width: 100%;
	height: 100%;
	max-width: 80px;
	max-height: 80px;
}
</style>