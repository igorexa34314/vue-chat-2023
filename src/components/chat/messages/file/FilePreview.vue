<template>
	<div v-bind="hoverProps" class="file-icon mx-1">
		<ImageFrame :image="file" rounded="true" height="100%" :loader="{ size: '30px', iconSize: '18px' }"
			@loaded="emit('loaded')" />
		<Transition name="fade">
			<div class="preview-hover" v-if="isHovering" @click="emit('openFile')">
				<v-icon :icon="mdiEyeOutline" size="22px" variant="text" class="file-icon-btn" color="white" density="compact"
					title="Open" flat :ripple="false" />
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import ImageFrame from '@/components/chat/messages/media/ImageFrame.vue';
import { mdiEyeOutline } from '@mdi/js';
import { Message } from '@/stores/messages';

const props = defineProps<{
	file: Message['content']['attachments'][number];
	isHovering: Boolean;
	hoverProps: Record<string, unknown>;
}>();
const emit = defineEmits<{
	(e: 'loaded'): void;
	(e: 'openFile'): void;
}>();
</script>

<style lang="scss" scoped>
.file-icon {
	user-select: none !important;
	cursor: pointer;
	width: 80px;
	height: 60px;
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
