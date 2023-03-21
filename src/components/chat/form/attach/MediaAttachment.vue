<template>
	<div class="images-grid">
		<v-row dense>
			<v-col v-for="(img, index) in files" :key="img.id" :cols="files.length % 2 && !index ? '12' : '6'">
				<v-card class="image-wrapper d-flex" height="100%" max-height="300px">
					<v-img aspect-ratio="1" ref="imgsEl" :lazy-src="img.thumbnail?.url" :src="img.preview"
						:alt="img.fileData.name" :id="img.id" cover>
						<template #placeholder>
							<div class="d-flex align-center justify-center fill-height">
								<v-progress-circular color="grey-lighten-4" indeterminate />
							</div>
						</template>
					</v-img>
					<v-btn color="white" variant="text" position="absolute" icon="mdi-delete"
						class="bg-blue-grey-darken-2 delete-media-btn" @click="emit('deleteAttach', img.id)"
						density="comfortable" elevation="5" />
				</v-card>
			</v-col>
		</v-row>
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

.delete-media-btn {
	bottom: 0;
	right: 0;
	transform: translate(-25%, -25%);
}

.image-wrapper {}
</style>