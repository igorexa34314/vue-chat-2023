<template>
	<v-card class="image__wrapper" variant="text" @click="emit('open');" width="100%" :height="image?.sizes.h"
		:max-height="maxHeight" rounded="0">
		<!-- <canvas></canvas> -->
		<v-img :lazy-src="image?.thumbnail || ''" :src="previewURL || image?.downloadURL" :alt="alt || image?.fullname"
			:width="image?.sizes.w" @load="imageLoaded" cover>
			<template #placeholder>
				<ImageLoader />
			</template>
		</v-img>
	</v-card>
</template>

<script setup lang="ts">
import ImageLoader from '@/components/chat/ImageLoader.vue';
import { onUnmounted, watchEffect, ref, PropType, } from 'vue';
import { loadImagebyFullpath } from '@/services/message';
import type { MediaMessage } from '@/stores/messages';

export type ImageWithPreviewURL = { previewURL: string } & MediaMessage['images'][number];

const props = defineProps({
	image: Object as PropType<MediaMessage['images'][number]>,
	maxHeight: {
		type: [String, Number],
		default: '280px'
	},
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
}
</style>