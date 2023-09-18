<template>
	<div v-bind="hoverProps" class="file-icon mx-1 d-flex align-center">
		<ImageFrame
			:image="file"
			rounded="true"
			:loader="{ size: smAndUp ? '30px' : '26px', iconSize: '18px' }"
			@loaded="emit('loaded')"
			max-height="100%" />

		<v-fade-transition>
			<div class="preview-hover" v-if="isHovering" @click="emit('openFile')">
				<v-icon
					:icon="mdiEyeOutline"
					:size="smAndUp ? '22px' : '18px'"
					variant="text"
					class="file-icon-btn d-inline-block mx-auto"
					color="white"
					density="compact"
					title="Open"
					flat
					:ripple="false" />
			</div>
		</v-fade-transition>
	</div>
</template>

<script setup lang="ts">
import { VFadeTransition } from 'vuetify/components';
import ImageFrame from '@/components/chat/messages/media/ImageFrame.vue';
import { mdiEyeOutline } from '@mdi/js';
import { useDisplay } from 'vuetify';
import { MessageAttachment } from '@/services/message';

const props = defineProps<{
	file: MessageAttachment;
	isHovering: Boolean;
	hoverProps: Record<string, unknown>;
}>();
const emit = defineEmits<{
	loaded: [];
	openFile: [];
}>();

const { smAndUp } = useDisplay();
</script>

<style lang="scss" scoped>
.file-icon {
	user-select: none;
	cursor: pointer;
	position: relative;
	width: 72px;
	height: 54px;
	@media (min-width: 600px) {
		width: 80px;
		height: 60px;
	}
	&-btn {
		position: absolute;
		max-width: 45px;
		font-size: 1.15em;
		line-height: 1;
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
</style>
