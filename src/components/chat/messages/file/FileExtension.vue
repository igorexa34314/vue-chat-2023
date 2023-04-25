<template>
	<div v-bind="hoverProps" style="cursor: pointer;" class="file-icon">
		<v-icon icon="mdi-file" size="80px" />
		<Transition name="fade">
			<span v-if="!isHovering" class="file-icon-ext font-weight-bold text-brown-darken-4">
				{{ getFileExt(file.fullname).length <= 6 ? getFileExt(file.fullname) : '' }} </span>
					<v-btn v-else icon="mdi-download" size="large" variant="text" class="file-icon-btn" color="black"
						density="compact" @click="emit('downloadFile')" title="Download" :flat="false" :ripple="false" />
		</Transition>
	</div>
</template>

<script setup lang="ts">
import { getFileExt } from '@/utils/filters/messages';
import type { FileMessage } from '@/stores/messages';

const props = defineProps<{
	file: FileMessage['files'][number];
	isHovering: Boolean;
	hoverProps: Record<string, unknown>;
}>();
const emit = defineEmits<{
	(e: 'downloadFile'): void;
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
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>