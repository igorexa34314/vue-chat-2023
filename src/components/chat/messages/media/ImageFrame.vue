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
			:lazy-src="image.thumbnail ?? undefined"
			:src="imageRef.raw?.previewURL"
			:alt="alt || image.fullname"
			width="100%"
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
import { onUnmounted, watch, toRef, computed } from 'vue';
import { MessagesService } from '@/services/message';
import { useDisplay } from 'vuetify';
import { storeToRefs } from 'pinia';
import { useLoadingStore } from '@/stores/loading';
import { maxMessageMedia, maxMessageMediaSm } from '@/global-vars';
import { type MessageAttachment } from '@/services/message';
import type { VImg, VCard } from 'vuetify/components';

const {
	image,
	width,
	maxHeight,
	height = 'auto',
	rounded = 0,
	loader,
	alt,
	aspectRatio,
} = defineProps<{
	image: MessageAttachment<'media'>;
	width?: string | number | VCard['width'];
	maxHeight?: string | number | VCard['maxHeight'];
	height?: string | number | VCard['height'];
	rounded?: string | number | boolean | VCard['rounded'];
	loader?: InstanceType<typeof ImageLoader>['$props'];
	alt?: string | VImg['alt'];
	aspectRatio?: VImg['aspectRatio'];
}>();

const emit = defineEmits<{
	open: [];
	loaded: [];
}>();

const { smAndUp } = useDisplay();
const loadingStore = useLoadingStore();
const { cancelLoading: cancelImageLoading, deleteLoading } = loadingStore;
const { getUploadingStateById } = storeToRefs(loadingStore);
const imageRef = toRef(() => image);
let previewURL = '';

watch(
	() => image.raw,
	async (newRaw, oldRaw) => {
		if (newRaw.fullpath && newRaw.fullpath !== oldRaw?.fullpath && !previewURL) {
			previewURL = await MessagesService.loadPreviewbyFullpath(newRaw.fullpath);
			deleteLoading(image.id);
		}
		imageRef.value.raw.previewURL = previewURL;
	},
	{ immediate: true }
);

const calcImageSize = computed(() => {
	const maxSize = smAndUp.value ? maxMessageMedia : maxMessageMediaSm;
	const { w, h } = image.raw.sizes!;
	const ar = w / h;
	if (w > maxSize.w || h > maxSize.h) {
		return w > h ? { w: maxSize.w, h: maxSize.w / ar } : { h: maxSize.h, w: maxSize.h * ar };
	} else return { w, h };
});

const imageLoaded = () => {
	if (image.raw.previewURL) {
		emit('loaded');
	}
};
const openImageFullsize = () => {
	if (image.raw?.previewURL) {
		emit('open');
	}
};
onUnmounted(() => {
	if (image.raw.previewURL) {
		URL.revokeObjectURL(image.raw.previewURL);
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
