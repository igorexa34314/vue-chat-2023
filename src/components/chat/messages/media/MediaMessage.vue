<template>
	<div class="media-message">
		<p v-if="content.subtitle.length" class="message__subtitle mb-3">{{ content.subtitle }}</p>
		<div class="images-frame">
			<v-row dense align="start" align-content="stretch">
				<v-col v-for="(img, index) of content.images" :cols="getImageColSize(content.images)[index]">
					<ImageFrame :image="img" :key="img.id" :alt="content.subtitle" @open="openInOverlay(img)"
						@loaded="addImagePreviewToOverlay" />
				</v-col>
			</v-row>
			<FullsizeOverlay v-model="overlayState.show" :content="<ImageWithPreviewURL[]>overlayState.images"
				v-model:currentItem="overlayState.currentImage" @close="overlayClosed" />
		</div>
	</div>
</template>

<script setup lang="ts">
import ImageFrame from '@/components/chat/messages/media/ImageFrame.vue';
import FullsizeOverlay from '@/components/chat/messages/media/FullsizeOverlay.vue';
import { reactive, PropType, computed } from 'vue';
import type { MediaMessage } from '@/stores/messages';
import type { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';

const props = defineProps({
	content: {
		type: Object as PropType<MediaMessage>,
		required: true,
	},
});

const overlayState: { show: boolean; currentImage: number, images: ImageWithPreviewURL[] } = reactive({
	show: false,
	images: [...props.content.images] as ImageWithPreviewURL[],
	currentImage: 0,
});

const openInOverlay = (img: MediaMessage['images'][number]) => {
	overlayState.show = true;
	overlayState.currentImage = props.content.images.indexOf(img);
}
const addImagePreviewToOverlay = ({ id, previewURL }: Pick<ImageWithPreviewURL, 'id' | 'previewURL'>) => {
	overlayState.images = overlayState.images.map((img) => img.id === id ? { ...img, previewURL } : img)
};
const overlayClosed = () => {
};
const getImageColSize = computed(() => (imgArray: MediaMessage['images']) => {
	const sizes = imgArray.map((img) => img.sizes.w);
	const acc = [];
	for (let i = 0; i < sizes.length - 1;) {
		const cols = Math.round(12 / ((sizes[i + 1] / sizes[i]) + 1));
		if (cols >= 7 || cols <= 4) {
			acc.push(12);
			i++;
		}
		else {
			acc.push(cols, 12 - cols);
			i += 2;
		}
	}
	return acc;
});
</script>

<style lang="scss" scoped>
// .images-frame {
// 	display: grid;
// 	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
// 	grid-template-rows: repeat(auto-fit, minmax(1fr, 200px));
// }
</style>