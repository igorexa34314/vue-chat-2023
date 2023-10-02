<template>
	<v-card
		v-if="image"
		class="image__wrapper d-flex justify-center"
		:data-attachment-id="image.id"
		variant="text"
		:width="width || calcImageSize.w"
		@click="openImageFullsize"
		:max-height="maxHeight || (smAndUp ? maxMessageMedia.h : maxMessageMediaSm.h)"
		:rounded="rounded"
		v-ripple="false"
		height="100%">
		<v-img
			:lazy-src="image.thumbnail ?? ''"
			:src="image.raw?.previewURL"
			:alt="alt || image.fullname"
			width="100%"
			eager
			@load="imageLoaded"
			cover
			draggable="false"
			:aspect-ratio="aspectRatio || (image.raw.sizes ? image.raw.sizes!.w / image.raw.sizes!.h : 1)"
			:height="height || calcImageSize.h">
			<template #placeholder>
				<ImageLoader
					v-bind="loader"
					:model-value="getUploadingStateById(image.id)?.progress"
					@cancel="cancelImageLoading(image.id)" />
			</template>
		</v-img>

		<!-- <canvas></canvas> -->
	</v-card>
</template>

<script setup lang="ts">
import ImageLoader from '@/components/chat/ImageLoader.vue';
import { onUnmounted, watchEffect, toRef } from 'vue';
import { MessagesService } from '@/services/message';
import { useDisplay } from 'vuetify';
import { useLoadingStore } from '@/stores/loading';
import { VImg, VCard } from 'vuetify/components';
import { MessageAttachment } from '@/services/message';
import { computed } from 'vue';
import { maxMessageMedia, maxMessageMediaSm } from '@/global-vars';

const props = withDefaults(
	defineProps<{
		image: MessageAttachment<'media'>;
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

const image = toRef(props, 'image');
const { smAndUp } = useDisplay();
const { cancelLoading: cancelImageLoading, getUploadingStateById } = useLoadingStore();

watchEffect(async () => {
	try {
		if (!image.value.raw.previewURL) {
			image.value.raw.previewURL = await MessagesService.loadPreviewbyFullpath(props.image.raw.fullpath);
		}
	} catch (e) {
		console.log(e);
	}
});

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
	if (props.image.raw?.previewURL) {
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
