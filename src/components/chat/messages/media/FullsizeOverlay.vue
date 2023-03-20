<template>
	<v-overlay v-if="content.length" v-model="showOverlay" content-class="image-overlay" class="fullsize-image__dialog"
		transition="scale-transition" @click:outside="$emit('close')">
		<v-carousel v-model="overlayItem" hide-delimiters hide-delimiter-background height="100%" show-arrows>
			<template v-slot:prev="{ props }">
				<div v-if="overlayItem" class="carousel__control carousel__control-prev" @click="props.onClick">
					<v-icon icon="mdi-arrow-left" size="55px" class="carousel-prev-btn" />
				</div>
			</template>
			<template v-slot:next="{ props }">
				<div v-if="overlayItem < content.length - 1" class="carousel__control carousel__control-next"
					@click="props.onClick">
					<v-icon icon="mdi-arrow-right" size="55px" class="carousel-next-btn" />
				</div>
			</template>
			<v-carousel-item v-for="item of content" :key="item.id" cover>
				<v-card class="fullsize-image__wrapper d-flex align-center justify-center" variant="text" max-width="75vw"
					max-height="85vh" :style="{ transform: `scale(${zoomed ? '2' : '1'})`, width: `${item.sizes.w}px` }">
					<v-img :src="item.previewURL" :alt="alt || item.fullname" :width="item.sizes.w">
						<template #placeholder>
							<div class="d-flex align-center justify-center fill-height">
								<v-progress-circular color="grey-lighten-4" indeterminate />
							</div>
						</template>
					</v-img>
				</v-card>
			</v-carousel-item>
		</v-carousel>

		<div class="actions__panel">
			<v-btn class="zoom-in__btn" :icon="zoomed ? 'mdi-magnify-minus-outline' : 'mdi-magnify-plus-outline'"
				variant="text" title="Zoom" @click="zoomImage" disabled />
			<v-btn class="download__btn" icon="mdi-download" variant="text"
				:href="content[currentItem || 0].previewURL || content[currentItem || 0].downloadURL"
				:download="content[currentItem || 0].fullname || 'image.png'" title="Download" />
			<v-btn class="close__btn" icon="mdi-close" variant="text" @click="closeOverlay" title="Close" />
		</div>
	</v-overlay>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useVModel } from '@vueuse/core';
import type { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';

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
.carousel__control {
	padding: 0px 1em;
	height: 100vh;
	display: flex;
	align-items: center;
	position: absolute;
	top: 50%;
	z-index: 1000;
	&-prev {
		padding-left: 2em;
		left: 0;
		transform: translateY(-50%);

	}
	&-next {
		padding-right: 2em;
		right: 0;
		transform: translateY(-50%);
	}
}
.carousel-prev-btn,
.carousel-next-btn {
	cursor: pointer;
}
</style>