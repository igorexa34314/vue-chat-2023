<template>
	<div class="media-message mb-3">
		<p v-if="content.subtitle.length" class="message__subtitle mb-3">{{ content.subtitle }}</p>
		<div class="images-frame">
			<v-row dense align-content="stretch" no-gutters>
				<v-col v-for="(img, index) of content.images" :cols="calcImageCols(index)"
					:class="{ 'image-col': content.images.length > 2 }">
					<ImageFrame :image="img" :key="img.id" :alt="content.subtitle" @open="emit('openInOverlay', img.id)"
						@loaded="('mediaLoaded')" :max-height="content.images.length > 2 ? '280px' : '360px'"
						:height="img.sizes.h" />
				</v-col>
			</v-row>
		</div>
	</div>
</template>

<script setup lang="ts">
import ImageFrame from '@/components/chat/messages/media/ImageFrame.vue';
import { computed } from 'vue';
import { calcImageCols as calcCols } from '@/utils/images';
import type { MediaMessage } from '@/stores/messages';
import type { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';

const props = defineProps<{
	content: MediaMessage;
}>();

const emit = defineEmits<{
	(e: 'openInOverlay', imgId: ImageWithPreviewURL['id']): void;
	(e: 'mediaLoaded'): void;
}>();

const calcImageCols = computed(() => (imgIdx: number) => calcCols(props.content.images.length, imgIdx));
</script>

<style lang="scss" scoped>
.images-frame {
	user-select: none !important;
}
.image-col {
	padding: 0.12em !important;
}
</style>