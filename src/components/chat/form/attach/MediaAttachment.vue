<template>
	<div class="images-grid">
		<v-card v-for="img of files" class="image-wrapper d-flex" :key="img.id">
			<v-img ref="imgsEl" :src="img.preview" :alt="img.fileData.name" :id="img.id" cover />
			<v-btn color="blue-grey-darken-4" variant="text" position="absolute" icon="mdi-delete" class="delete-media-btn"
				@click="emit('deleteAttach', img.id)" />
		</v-card>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AttachedContent } from '@/components/chat/form/attach/AttachDialog.vue';
import type { VImg } from 'vuetify/components';

const props = defineProps<{
	files: AttachedContent
}>();
const emit = defineEmits<{
	(e: 'deleteAttach', imgId: AttachedContent[number]['id']): void
}>();

const imgsEl = ref<VImg[]>();
const isImgsReady = computed(() => imgsEl.value?.every(img => img.state === 'loaded'));

defineExpose({ isImgsReady });
</script>

<style scoped lang="scss">
.images-grid {
	padding: 0.7em 0.2em 0.5em 0;
	max-width: 450px;
	max-height: 400px;
	margin: 0 auto;
	display: grid;
	justify-content: space-between;
	grid-gap: 8px;
	grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
	grid-template-rows: repeat(auto-fit, minmax(48.5%, 1fr));

	@media(max-width: 760px) {
		max-width: 400px;
	}

	@media(max-width: 560px) {
		max-width: 320px;
		grid-template-rows: repeat(auto-fit, minmax(35%, 1fr));
	}
}

.delete-media-btn {
	bottom: 0;
	right: 0;
}

.image-wrapper {}
</style>