<template>
	<div v-bind="hoverProps" class="file-icon px-1" style="cursor: pointer; width: 80px">
		<ImageFrame :image="file" max-height="80" width="100%" rounded="true" :loader="{ size: '30px', iconSize: '18px' }"
			@loaded="(mediaReady: ImageWithPreviewURL) => emit('loaded', mediaReady)" />
		<Transition name="fade">
			<div class="preview-hover" v-if="isHovering">
				<v-btn icon="mdi-eye-outline" size="large" variant="text" class="file-icon-btn" color="white" density="compact"
					@click="emit('openFile')" title="Open" :flat="false" :ripple="false" />
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import ImageFrame from '@/components/chat/messages/media/ImageFrame.vue';
import type { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';
import type { FileMessage } from '@/stores/messages';

const props = defineProps<{
	file: FileMessage['files'][number];
	isHovering: Boolean;
	hoverProps: Record<string, unknown>;
}>();
const emit = defineEmits<{
	(e: 'loaded', media: ImageWithPreviewURL): void;
	(e: 'openFile'): void;
}>();
</script>

<style lang="scss" scoped>
.file-icon {
	position: relative;
	&-ext, &-btn {
		margin-left: auto;
		margin-right: auto;
		max-width: 45px;
		font-size: 1.15em;
		line-height: 1;
		display: inline-block;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -30%);
	}
	&-btn {
		transform: translate(-50%, -40%);
	}
}
.preview-hover {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: 4px;
	background-color: rgba($color: #000000, $alpha: 0.75);
}
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
