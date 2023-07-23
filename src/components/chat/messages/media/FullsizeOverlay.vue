<template>
	<v-overlay v-if="content.length" v-model="showOverlay" content-class="image-overlay" class="fullsize-image__dialog"
		transition="scale-transition" @click:outside="$emit('close')" close-on-back scroll-strategy="close">
		<v-carousel v-model="overlayItem" hide-delimiters hide-delimiter-background height="85vh" show-arrows>
			<template #prev="{ props }">
				<div v-if="overlayItem" class="carousel__control carousel__control-prev" @click="props.onClick">
					<v-icon :icon="mdiArrowLeft" size="55px" class="carousel-prev-btn" />
				</div>
			</template>
			<template #next="{ props }">
				<div v-if="overlayItem < content.length - 1" class="carousel__control carousel__control-next"
					@click="props.onClick">
					<v-icon :icon="mdiArrowRight" size="55px" class="carousel-next-btn" />
				</div>
			</template>
			<v-carousel-item v-for="item of content" :key="item.id" cover>
				<div class="carousel-image-element" style="max-width: 75vw;">
					<v-card class="fullsize-image__wrapper d-flex align-center justify-center" variant="text"
						:width="item.raw.sizes?.w" :height="item.raw.sizes?.h" max-height="100%" max-width="100%"
						:style="{ transform: `scale(${zoomed ? '2' : '1'})` }">
						<v-img :src="item.raw.previewURL" :alt="alt || item.fullname" :width="item.raw.sizes?.w">
							<template #placeholder>
								<ImageLoader />
							</template>
						</v-img>
					</v-card>
				</div>
			</v-carousel-item>
		</v-carousel>

		<div class="actions__panel">
			<v-btn class="zoom-in__btn" :icon="zoomed ? mdiMagnifyMinusOutline : mdiMagnifyPlusOutline" variant="text"
				title="Zoom" @click="zoomImage" disabled />
			<v-btn class="download__btn" :icon="mdiDownload" variant="text"
				:href="content[currentItem || 0].raw.previewURL || content[currentItem || 0].raw.downloadURL"
				:download="content[currentItem || 0].fullname || 'image.png'" title="Download" />
			<v-btn class="close__btn" :icon="mdiClose" variant="text" @click="closeOverlay" title="Close" />
		</div>
	</v-overlay>
</template>

<script setup lang="ts">
import { mdiArrowLeft, mdiArrowRight, mdiMagnifyPlusOutline, mdiMagnifyMinusOutline, mdiDownload, mdiClose } from '@mdi/js';
import ImageLoader from '@/components/chat/ImageLoader.vue';
import { ref } from 'vue';
import { useVModel } from '@vueuse/core';
import { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';

interface OverlayProps {
	modelValue?: boolean;
	content: ImageWithPreviewURL[];
	currentItem?: number;
	alt?: string;
}
const props = withDefaults(defineProps<OverlayProps>(), {
	modelValue: false,
	currentItem: 0,
});
const emit = defineEmits<{
	(e: 'update:modelValue', val: boolean): void;
	(e: 'update:currentItem', val: number): void;
	(e: 'close'): void;
}>();

const showOverlay = useVModel(props, 'modelValue', emit);
const overlayItem = useVModel(props, 'currentItem', emit);

const closeOverlay = () => {
	emit('update:modelValue', false);
	zoomed.value = false;
	emit('close');
};

// Zoom Image
const zoomed = ref(false);
const zoomImage = () => {
	zoomed.value = !zoomed.value;
};
</script>

<style lang="scss" scoped>
.fullsize-image__dialog :deep(.v-overlay__scrim) {
	background: #000000;
	opacity: 90%;
}
:global(.image-overlay) {
	pointer-events: none;
	position: fixed;
	width: 100vw;
	min-height: 100vh;
	margin: 0 !important;
	display: flex;
	align-items: center;
}
.fullsize-image__wrapper {
	pointer-events: all;
	transition: transform 0.09s ease-in 0s;
	margin: 0 auto;
	& img {
		display: block;
		max-width: 100%;
		height: auto;
		object-fit: contain;
	}
}
.actions__panel {
	pointer-events: all;
	padding: 10px 2em;
	top: 0;
	left: 0;
	right: 0;
	position: fixed;
	display: flex;
	column-gap: 0.5rem;
	justify-content: flex-end;
}
.carousel-image-element {
	width: 100%;
	height: 100%;
	margin: auto;
	display: flex;
	align-items: center;
	justify-content: center;
}
.carousel__control {
	padding: 0px 1em;
	height: 100vh;
	display: flex;
	align-items: center;
	position: absolute;
	top: 50%;
	z-index: 1000;
	&-prev {
		padding-left: 1.5em;
		left: 0;
		transform: translateY(-50%);

	}
	&-next {
		padding-right: 1.5em;
		right: 0;
		transform: translateY(-50%);
	}
}
.carousel-prev-btn,
.carousel-next-btn {
	visibility: hidden;
	opacity: 0;
	cursor: pointer;
	transition: all 0.2s ease 0s;
	.carousel__control:hover & {
		opacity: 1;
		visibility: visible;
	}
}
</style>