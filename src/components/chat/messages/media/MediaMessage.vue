<template>
	<div class="media-message mb-3">
		<TextMessage v-if="content.text.length" v-bind="{ content }" class="message__subtitle mb-3" />

		<div class="images-frame" :style="{ 'max-width': `${imageSize.w}px` }">
			<v-row dense align-content="stretch" no-gutters>
				<v-col
					v-for="(img, index) of content.attachments"
					:key="img.id"
					:cols="calcImageCols(index)"
					:class="{ 'image-col': content.attachments.length > 2 }">
					<ImageFrame
						:image="img"
						:key="img.id"
						:alt="content.text"
						@open="emit('openInOverlay', img.id)"
						@loaded="('mediaLoaded')"
						:width="content.attachments.length > 1 ? imageSize.w : undefined"
						:max-height="content.attachments.length > 2 ? '400px' : `${imageSize.h}px`" />
				</v-col>
			</v-row>
		</div>
	</div>
</template>

<script setup lang="ts">
import TextMessage from '@/components/chat/messages/text/TextMessage.vue';
import ImageFrame from '@/components/chat/messages/media/ImageFrame.vue';
import { computed } from 'vue';
import { calcImageCols as calcCols } from '@/utils/images';
import { Message } from '@/stores/messages';
import { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';
import { maxMessageMedia, maxMessageMediaSm } from '@/global-vars';
import { useDisplay } from 'vuetify';

const props = defineProps<{
	content: Message['content'];
}>();

const emit = defineEmits<{
	openInOverlay: [imgId: ImageWithPreviewURL['id']];
	mediaLoaded: [];
}>();

const { smAndUp } = useDisplay();

const imageSize = smAndUp.value ? maxMessageMedia : maxMessageMediaSm;
const calcImageCols = computed(() => (imgIdx: number) => calcCols(props.content.attachments.length, imgIdx));
</script>

<style lang="scss" scoped>
.images-frame {
	user-select: none;
}
.image-col {
	padding: 0.1em;
}
</style>
