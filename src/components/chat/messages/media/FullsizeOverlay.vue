<template>
	<v-overlay
		v-if="content.length"
		v-model="showOverlay"
		content-class="image-overlay d-flex align-center ma-0"
		class="fullsize-image__dialog"
		transition="scale-transition"
		@click:outside="emit('close')"
		close-on-back
		scroll-strategy="close">
		<v-carousel
			v-model="overlayItem"
			hide-delimiters
			hide-delimiter-background
			height="85vh"
			show-arrows
			:continuous="false">
			<template #prev="{ props }">
				<div
					v-if="smAndUp && overlayItem"
					class="carousel__control d-flex align-center carousel__control-prev"
					@click="props.onClick">
					<v-icon :icon="mdiChevronLeft" size="60px" color="#ffffffbf" class="carousel-prev-btn" />
				</div>
			</template>
			<template #next="{ props }">
				<div
					v-if="smAndUp && overlayItem < content.length - 1"
					class="carousel__control d-flex align-center carousel__control-next"
					@click="props.onClick">
					<v-icon :icon="mdiChevronRight" size="60px" class="carousel-next-btn" />
				</div>
			</template>

			<v-carousel-item v-for="item of content" :key="item.id" cover>
				<div
					class="carousel-image-element d-flex align-center justify-center ma-auto w-100 h-100"
					style="max-width: 75vw">
					<v-card
						class="fullsize-image__wrapper d-flex align-center justify-center my-0 mx-auto"
						variant="text"
						:width="item.raw.sizes?.w"
						:height="item.raw.sizes?.h"
						max-height="100%"
						max-width="100%"
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

		<div class="actions__panel d-flex justify-end">
			<v-btn
				class="zoom-in__btn"
				:icon="zoomed ? mdiMagnifyMinusOutline : mdiMagnifyPlusOutline"
				variant="text"
				title="Zoom"
				@click="zoomImage"
				disabled />
			<v-btn
				class="download__btn"
				:icon="mdiDownload"
				variant="text"
				:href="content[currentItem || 0].raw.previewURL"
				:download="content[currentItem || 0].fullname || 'image.png'"
				title="Download" />
			<v-btn class="close__btn" :icon="mdiClose" variant="text" @click="closeOverlay" title="Close" />
		</div>
	</v-overlay>
</template>

<script setup lang="ts">
import { VOverlay, VCarousel, VCarouselItem } from 'vuetify/components';
import {
	mdiChevronLeft,
	mdiChevronRight,
	mdiMagnifyPlusOutline,
	mdiMagnifyMinusOutline,
	mdiDownload,
	mdiClose,
} from '@mdi/js';
import ImageLoader from '@/components/chat/ImageLoader.vue';
import { ref } from 'vue';
import { useVModel } from '@vueuse/core';
import { MediaAttachment } from '@/services/message';
import { useDisplay } from 'vuetify';

interface OverlayProps {
	modelValue?: boolean;
	content: MediaAttachment[];
	currentItem?: number;
	alt?: string;
}
const props = withDefaults(defineProps<OverlayProps>(), {
	modelValue: false,
	currentItem: 0,
});
const emit = defineEmits<{
	'update:modelValue': [val: boolean];
	'update:currentItem': [val: number];
	close: [];
}>();

const { smAndUp } = useDisplay();
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
	background-color: #000000;
	opacity: 90%;
}
:global(.image-overlay) {
	pointer-events: none;
	position: fixed;
	width: 100vw;
	min-height: 100dvh;
	min-height: 100vh;
}
.fullsize-image__wrapper {
	pointer-events: all;
	transition: transform 0.09s ease-in 0s;
	& img {
		display: block;
		max-width: 100%;
		height: auto;
		object-fit: contain;
	}
}
.carousel__control {
	position: absolute;
	height: 100dvh;
	height: 100vh;
	top: 50%;
	padding: 0px 1em;
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
.actions__panel {
	pointer-events: all;
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	padding: 10px 2em;
	column-gap: 0.5rem;
}
</style>
