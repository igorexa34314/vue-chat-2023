<template>
	<div v-if="mediaFiles.length" class="images-grid">
		<v-row dense>
			<v-col v-for="(img, index) in mediaFiles" :key="img.id" :cols="calcImageCols(index)">
				<PreviewImage :preview-item="img" :max-height="files.length < 2 ? '380px' : '300px'"
					:img-ratio="+calcImageCols(index) > 6 && index ? '1.778' : '1'" ref="prevEl"
					@delete-item="imgId => emit('deleteAttach', imgId)" />
			</v-col>
		</v-row>
	</div>
	<!-- <div v-if="otherFiles.length" class="mt-4">
		<FileAttachment :files="otherFiles" />
	</div> -->
</template>

<script setup lang="ts">
// import FileAttachment from '@/components/chat/attach/FileAttachment.vue';
import PreviewImage from '@/components/chat/attach/PreviewImage.vue';
import { ref, computed } from 'vue';
import { calcImageCols as calcCols } from '@/utils/images';
import { AttachedContent } from '@/components/chat/attach/AttachDialog.vue';

const props = defineProps<{
	files: AttachedContent
}>();

const emit = defineEmits<{
	deleteAttach: [imgId: AttachedContent[number]['id']]
}>();

const mediaFiles = computed(() => props.files.filter(file => file.fileData.type.startsWith('image/')));
// const otherFiles = computed(() => props.files.filter(file => !file.fileData.type.startsWith('image/')));
const prevEl = ref<InstanceType<typeof PreviewImage>[]>();
const isImgsReady = computed(() => prevEl.value?.map(img => img.imgEl).every(img => img?.state === 'loaded'));
const calcImageCols = computed(() => (imgIdx: number) => calcCols(mediaFiles.value.length, imgIdx));
defineExpose({ isImgsReady });
</script>

<style lang="scss" scoped>
.images-grid {
	padding: 0.7em 0.2em 0.5em 0;
	width: 100%;
	height: 100%;
	max-width: 450px;
	max-height: 400px;
	margin: 0 auto;

	@media(max-width: 760px) {
		max-width: 400px;
	}

	@media(max-width: 560px) {
		max-width: 320px;
	}
}
</style>