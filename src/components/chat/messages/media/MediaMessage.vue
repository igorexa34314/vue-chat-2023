<template>
	<div class="media-message mb-3">
		<p v-if="content.subtitle.length" class="message__subtitle mb-3">{{ content.subtitle }}</p>
		<div class="images-frame">
			<v-row dense align-content="stretch" no-gutters>
				<v-col v-for="(img, index) of content.images" :cols="calcImageCols(index)"
					:class="{ 'image-col': content.images.length > 2 }">
					<ImageFrame :image="img" :key="img.id" :alt="content.subtitle" @open="openInOverlay(img)"
						@loaded="addImagePreviewToOverlay" :max-height="content.images.length > 2 ? '280px' : '360px'" />
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
import { calcImageCols as calcCols } from '@/utils/images';
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
const calcImageCols = computed(() => (imgIdx: number) => calcCols(props.content.images.length, imgIdx));
</script>

<style lang="scss" scoped>
.image-col {
	border: 0.15em solid #311B92 !important;
}
</style>