<template>
	<div class="images-frame">
		<ImageFrame v-for="img of images" :image="img" :key="img.id" @open="openInOverlay" :alt="alt" />
		<FullsizeOverlay v-model="overlayState.show" :content="overlayState.content" />
	</div>
</template>

<script setup lang="ts">
import ImageFrame from '@/components/chat/messages/media/ImageFrame.vue';
import FullsizeOverlay from '@/components/chat/messages/media/FullsizeOverlay.vue';
import { reactive } from 'vue';

const props = defineProps({
	images: {
		type: Array,
		required: true,
	},
	alt: {
		type: String,
	}
});

const overlayState = reactive({
	show: false,
	content: null,
});

const openInOverlay = (img) => {
	overlayState.content = img;
	overlayState.show = true;
}
</script>

<style lang="scss" scoped>
.images-frame {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	grid-template-rows: repeat(auto-fit, minmax(1fr, 200px));
}
</style>