<template>
	<v-card class="image-wrapper d-flex" height="100%" :max-height="maxHeight">
		<v-img
			:aspect-ratio="imgRatio"
			ref="imgEl"
			:lazy-src="previewItem.thumbnail?.url"
			:src="previewItem.preview"
			:alt="previewItem.fileData.name"
			cover
			eager>
			<template #placeholder>
				<ImageLoader />
			</template>
		</v-img>
		<v-btn
			color="white"
			variant="text"
			position="absolute"
			:icon="mdiDelete"
			class="bg-blue-grey-darken-2 delete-media-btn"
			@click="emit('delete-item', previewItem.id)"
			density="comfortable"
			elevation="5" />
	</v-card>
</template>

<script setup lang="ts">
import { mdiDelete } from '@mdi/js';
import ImageLoader from '@/components/chat/ImageLoader.vue';
import { ref } from 'vue';
import type { VImg } from 'vuetify/components';
import type { AttachedContent } from '@/components/chat/attach/AttachDialog.vue';
import type { MediaAttachment } from '@/services/message';

const { maxHeight = '300px', imgRatio = 1 } = defineProps<{
	previewItem: AttachedContent;
	maxHeight?: string | number;
	imgRatio?: string | number;
}>();

const emit = defineEmits<{
	'delete-item': [itemId: MediaAttachment['id']];
}>();

const imgEl = ref<VImg | null>(null);

defineExpose({ imgEl });
</script>

<style lang="scss" scoped>
.delete-media-btn {
	bottom: 0;
	right: 0;
	transform: translate(-25%, -25%);
}
</style>
