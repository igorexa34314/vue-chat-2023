<template>
	<div v-if="previewItem.fileData.type.startsWith('image/')" class="file-preview pa-1">
		<v-card height="100%" width="100%" variant="tonal">
			<v-img aspect-ratio="1" ref="imgEl" :lazy-src="previewItem.thumbnail?.url" :src="previewItem.preview"
				:alt="previewItem.fileData.name" cover eager>
				<template #placeholder>
					<ImageLoader width="2" size="30" icon-size="16" />
				</template>
			</v-img>
		</v-card>
	</div>

	<div v-else class="file-icon">
		<v-icon :icon="mdiFile" size="80px" />
		<span class="file-icon-ext font-weight-black text-brown-darken-4">
			{{ getFileExt(previewItem.fileData.name).length <= 5 ? getFileExt(previewItem.fileData.name) : '' }}</span>
	</div>

	<div class="file-details ml-2 text-subtitle-1 font-weight-medium flex-grow-1">
		<p class="text-subtitle-1">{{ previewItem.fileData.name }}</p>
		<p class="mt-1 text-body-2">{{ formatFileSize(previewItem.fileData.size) }}</p>
	</div>
	<v-btn :icon="mdiTrashCanOutline" size="default" variant="text" class="delete-file-btn ml-2"
		@click="emit('delete-item', previewItem.id)" />
</template>

<script setup lang="ts">
import { mdiFile, mdiTrashCanOutline } from '@mdi/js';
import ImageLoader from '@/components/chat/ImageLoader.vue';
import { ref } from 'vue';
import { formatFileSize, getFileExt } from '@/utils/filters/messages';
import { VImg } from 'vuetify/components';
import { AttachedContent } from '@/components/chat/attach/AttachDialog.vue';

const props = withDefaults(defineProps<{
	previewItem: AttachedContent[number];
}>(), {
});

const emit = defineEmits<{
	'delete-item': [itemId: string]
}>();

const imgEl = ref<VImg>();

defineExpose({ imgEl });
</script>

<style lang="scss" scoped>
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