<template>
	<v-card class="image__wrapper" variant="text" @click="emit('open');"
		:style="`width: ${image?.sizes.w}px; height: ${image?.sizes.h}px;`">
		<!-- <canvas></canvas> -->
		<v-img :lazy-src="image?.thumbnail || ''" :src="previewURL || image?.downloadURL" :alt="alt || image?.fullname"
			:width="image?.sizes.w" @load="imageLoaded">
			<template #placeholder>
				<div class="d-flex align-center justify-center fill-height">
					<v-progress-circular color="grey-lighten-4" indeterminate />
				</div>
			</template>
		</v-img>
	</v-card>
</template>

<script setup lang="ts">
import { onUnmounted, watchEffect, ref, PropType, } from 'vue';
import { loadImagebyFullpath } from '@/services/message';
import type { MediaMessage } from '@/types/db/MessagesTable';


export type ImageWithPreviewURL = { previewURL: string } & MediaMessage['images'][number];

const props = defineProps({
	image: Object as PropType<MediaMessage['images'][number]>,
	alt: String,
});
const emit = defineEmits<{
	(e: 'open'): void,
	(e: 'loaded', image: Pick<ImageWithPreviewURL, 'id' | 'previewURL'>): void,
}>();

const previewURL = ref('');

watchEffect(async () => {
	try {
		previewURL.value = await loadImagebyFullpath(props.image as MediaMessage['images'][number]) || '';
	} catch (e: unknown) { }
});

const imageLoaded = () => {
	if (previewURL.value) {
		emit('loaded', { id: props.image?.id as string, previewURL: previewURL.value });
	}
}
onUnmounted(() => {
	if (previewURL.value) {
		URL.revokeObjectURL(previewURL.value);
	}
});
</script>

<style lang="scss" scoped>
.image__wrapper {
	display: flex;
	justify-content: center;
	max-width: 100%;
	max-height: 100%;
	&:deep(img) {
		max-width: 100%;
		display: block;
		height: auto;
	}
}
</style>