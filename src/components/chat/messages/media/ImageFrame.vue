<template>
	<v-card
		v-if="image"
		class="image__wrapper d-flex justify-center"
		variant="text"
		:width="width || calcImageSize.w"
		@click="openImageFullsize"
		:max-height="maxHeight || (smAndUp ? maxMessageMedia.h : maxMessageMediaSm.h)"
		:rounded="rounded"
		v-ripple="false"
		height="100%">
		<v-img
			:lazy-src="image.thumbnail"
			:src="image.raw?.previewURL || image.raw?.downloadURL"
			:alt="alt || image.fullname"
			width="100%"
			eager
			@load="imageLoaded"
			cover
			draggable="false"
			:aspect-ratio="aspectRatio || (image.raw.sizes ? image.raw.sizes!.w / image.raw.sizes!.h : 1)"
			:height="height || calcImageSize.h"
			#placeholder>
			<ImageLoader
				v-bind="loader"
				:model-value="getUploadingStateById(image.id)?.progress"
				@cancel="cancelImageLoading(image.id)" />
		</v-img>

		<!-- <canvas></canvas> -->
	</v-card>
</template>

<script setup lang="ts">
import ImageLoader from '@/components/chat/ImageLoader.vue';
import { onUnmounted, watchEffect, toRef } from 'vue';
import { MessagesService } from '@/services/message';
import { storeToRefs } from 'pinia';
import { useDisplay } from 'vuetify';
import { useLoadingStore } from '@/stores/loading';
import { useMessagesStore } from '@/stores/messages';
import { VImg, VCard } from 'vuetify/components';
import { MessageContentWithPreview } from '@/stores/messages';
import { computed } from 'vue';
import { maxMessageMedia, maxMessageMediaSm } from '@/global-vars';

export type ImageWithPreviewURL = MessageContentWithPreview['attachments'][number];

const props = withDefaults(
	defineProps<{
		image: ImageWithPreviewURL;
		width?: string | number | VCard['width'];
		maxHeight?: string | number | VCard['maxHeight'];
		height?: string | number | VCard['height'];
		rounded?: string | number | boolean | VCard['rounded'];
		loader?: InstanceType<typeof ImageLoader>['$props'];
		alt?: string | VImg['alt'];
		aspectRatio?: VImg['aspectRatio'];
	}>(),
	{
		height: 'auto',
		rounded: 0,
	}
);
const emit = defineEmits<{
	open: [];
	loaded: [];
}>();

const { smAndUp } = useDisplay();
const { setAttachPreviewURL } = useMessagesStore();
const { getUploadingStateById } = storeToRefs(useLoadingStore());
watchEffect(async () => {
	try {
		if (!props.image.raw.previewURL) {
			const previewURL = await MessagesService.loadPreviewbyFullpath(props.image.raw);
			setAttachPreviewURL(toRef(props, 'image'), previewURL as string);
		}
	} catch (e) {}
});
const cancelImageLoading = (imgId: string) => {
	getUploadingStateById.value(imgId)?.task.cancel();
};

const calcImageSize = computed(() => {
	const maxSize = smAndUp.value ? maxMessageMedia : maxMessageMediaSm;
	const { w, h } = props.image.raw.sizes!;
	const ar = w / h;
	if (w > maxSize.w || h > maxSize.h) {
		return w > h ? { w: maxSize.w, h: maxSize.w / ar } : { h: maxSize.h, w: maxSize.h * ar };
	} else return { w, h };
});

const imageLoaded = () => {
	if (props.image.raw.previewURL) {
		emit('loaded');
	}
};
const openImageFullsize = () => {
	if (props.image.raw?.previewURL || props.image.raw?.downloadURL) {
		emit('open');
	}
};
onUnmounted(() => {
	if (props.image.raw.previewURL) {
		URL.revokeObjectURL(props.image.raw.previewURL);
	}
});
</script>

<style lang="scss" scoped>
.image__wrapper {
	user-select: none;
	max-width: 100%;
	max-height: 100%;
	:deep(img) {
		user-select: text;
		pointer-events: none;
	}
}
</style>
