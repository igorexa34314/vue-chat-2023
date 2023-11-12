<template>
	<div v-if="mediaFiles.length" class="images-grid w-100 h-100 my-0 mx-auto">
		<v-row dense>
			<v-col v-for="(img, index) in mediaFiles" :key="img.id" :cols="calcImageCols(index)">
				<PreviewImage
					:preview-item="img"
					:max-height="files.length < 2 ? '380px' : '300px'"
					:img-ratio="+calcImageCols(index) > 6 && index ? '1.778' : '1'"
					ref="prevEl"
					@delete-item="imgId => emit('deleteAttach', imgId)" />
			</v-col>
		</v-row>
	</div>
</template>

<script setup lang="ts">
import PreviewImage from '@/components/chat/attach/PreviewImage.vue';
import { ref, computed } from 'vue';
import { calcImageCols as calcCols } from '@/utils/images';
import type { AttachedContent } from '@/components/chat/attach/AttachDialog.vue';

const { files } = defineProps<{
	files: AttachedContent[];
}>();

const emit = defineEmits<{
	deleteAttach: [imgId: AttachedContent['id']];
}>();

const mediaFiles = computed(() => files.filter(file => file.fileData.type.startsWith('image/')));
const prevEl = ref<InstanceType<typeof PreviewImage>[]>([]);

const calcImageCols = computed(() => (imgIdx: number) => calcCols(mediaFiles.value.length, imgIdx));

const isImgsReady = computed(() => prevEl.value?.map(img => img.imgEl).every(img => img?.state === 'loaded'));
defineExpose({ isImgsReady });
</script>

<style lang="scss" scoped>
.images-grid {
	padding: 0 0.2em 0.5em 0;
	max-width: 450px;
	max-height: 400px;

	@media (max-width: 760px) {
		max-width: 400px;
	}

	@media (max-width: 560px) {
		max-width: 320px;
	}
}
</style>
