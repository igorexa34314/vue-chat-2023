<template>
	<v-card class="image-wrapper d-flex" height="100%" :max-height="maxHeight">
		<v-img :aspect-ratio="imgRatio" ref="imgEl" :lazy-src="previewItem.thumbnail?.url" :src="previewItem.preview"
			:alt="previewItem.fileData.name" cover eager>
			<template #placeholder>
				<ImageLoader />
			</template>
		</v-img>
		<v-btn color="white" variant="text" position="absolute" :icon="mdiDelete"
			class="bg-blue-grey-darken-2 delete-media-btn" @click="emit('delete-item', previewItem.id)" density="comfortable"
			elevation="5" />
	</v-card>
</template>

<script setup lang="ts">
import { mdiDelete } from '@mdi/js';
import ImageLoader from '@/components/chat/ImageLoader.vue';
import { ref } from 'vue';
import { AttachedContent } from '@/components/chat/form/attach/AttachDialog.vue';
import { VImg } from 'vuetify/components';

const props = withDefaults(defineProps<{
	previewItem: AttachedContent[number]
	maxHeight?: string | number;
	imgRatio?: string | number
}>(), {
	maxHeight: '300px',
	imgRatio: 1,
});
const emit = defineEmits<{
	(e: 'delete-item', itemId: string): void;
}>();
const imgEl = ref<VImg>();
defineExpose({ imgEl });
</script>

<style scoped lang="scss">
.delete-media-btn {
	bottom: 0;
	right: 0;
	transform: translate(-25%, -25%);
}

.image-wrapper {}
</style>