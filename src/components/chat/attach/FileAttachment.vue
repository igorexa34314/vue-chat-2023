<template>
	<div v-for="file of files" :key="file.id" class="d-flex align-center">
		<PreviewFile :preview-item="file" ref="prevEl" @delete-item="fileId => emit('deleteAttach', fileId)" />
	</div>
</template>

<script setup lang="ts">
import PreviewFile from '@/components/chat/attach/PreviewFile.vue';
import { ref, computed } from 'vue';
import { AttachedContent } from '@/components/chat/attach/AttachDialog.vue';

const props = defineProps<{
	files: AttachedContent
}>();
const emit = defineEmits<{
	deleteAttach: [imgId: AttachedContent[number]['id']]
}>();

const getFilePreview = computed(() => {

});

const prevEl = ref<InstanceType<typeof PreviewFile>[]>();
const isFilesReady = computed(() => {
	const imgsEl = prevEl.value?.filter(el => el.imgEl).map(el => el.imgEl);
	return imgsEl?.length ? imgsEl.every(img => img?.state === 'loaded') : true
});
defineExpose({ isFilesReady });
</script>