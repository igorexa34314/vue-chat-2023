<template>
	<div class="media-message">
		<p v-if="content.subtitle.length" class="message__subtitle mb-3">{{ content.subtitle }}</p>
		<div class="images-frame">
			<ImageFrame v-for="img of content.images" :image="img" :key="img.id" @open="openInOverlay"
				:alt="content.subtitle" />
			<FullsizeOverlay v-model="overlayState.show" :content="overlayState.content" @close="overlayClosed" />
		</div>
	</div>
</template>

<script setup lang="ts">
import ImageFrame from '@/components/chat/messages/media/ImageFrame.vue';
import FullsizeOverlay from '@/components/chat/messages/media/FullsizeOverlay.vue';
import { reactive, PropType } from 'vue';
import type { MediaMessage } from '@/types/db/MessagesTable';
import type { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';

const props = defineProps({
	content: {
		type: Object as PropType<MediaMessage>,
		required: true,
	},
});

const overlayState: { show: boolean; content: ImageWithPreviewURL | null } = reactive({
	show: false,
	content: null,
});

const openInOverlay = (img: ImageWithPreviewURL) => {
	overlayState.content = img;
	overlayState.show = true;
}
const overlayClosed = () => {
	overlayState.content = null;
};
</script>

<style lang="scss" scoped>
.images-frame {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	grid-template-rows: repeat(auto-fit, minmax(1fr, 200px));
}
</style>