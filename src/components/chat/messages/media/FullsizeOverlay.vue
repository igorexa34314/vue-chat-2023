<template>
	<v-overlay v-if="content" v-model="showOverlay" content-class="image-overlay" class="fullsize-image__dialog"
		transition="scale-transition">
		<v-card class="fullsize-image__wrapper" variant="text" max-width="80vw" max-height="90vh" style="overflow: hidden;">
			<v-img :src="content.previewURL" :alt="alt || content.fullname" :width="content.sizes.w"
				:height="content.sizes.h">
				<template v-slot:placeholder>
					<div class="d-flex align-center justify-center fill-height">
						<v-progress-circular color="grey-lighten-4" indeterminate />
					</div>
				</template>
			</v-img>
		</v-card>
		<div class="actions__panel">
			<v-btn class="download__btn" icon="mdi-download" variant="text" :href="content.previewURL || content.downloadURL"
				:download="content.fullname || 'image.png'" title="Download" />
			<v-btn class="close__btn" icon="mdi-close" variant="text" @click="closeOverlay" title="Close" />
		</div>
	</v-overlay>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import type { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';

interface OverlayProps {
	modelValue?: boolean;
	content: ImageWithPreviewURL | null;
	alt?: string;
}
const props = withDefaults(defineProps<OverlayProps>(), {
	modelValue: false,
});
const emit = defineEmits<{
	(e: 'update:modelValue', val: boolean): void;
	(e: 'close'): void;
}>();

const showOverlay = useVModel(props, 'modelValue', emit);

const closeOverlay = () => {
	emit('update:modelValue', false);
	emit('close');
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
	// transform: translate(-50%, -50%);
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
</style>