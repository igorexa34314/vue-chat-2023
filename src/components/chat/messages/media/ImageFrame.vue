<template>
   <v-card v-if="image" class="image__wrapper" variant="text" :width="width || calcImageSize.w" @click="openImageFullsize"
      :max-height="maxHeight" :rounded="rounded" v-ripple="false" height="100%">
      <!-- <canvas></canvas> -->
      <v-img :lazy-src="image.thumbnail" :src="image.raw?.previewURL || image.raw?.downloadURL"
         :alt="alt || image.fullname" width="100%" eager @load="imageLoaded" cover draggable="false"
         :aspect-ratio="aspectRatio || (image.raw.sizes!.w / image.raw.sizes!.h)" :height="height || calcImageSize.h">
         <template #placeholder>
            <ImageLoader v-bind="loader" :model-value="getUploadingStateById(image.id)?.progress"
               @cancel="cancelImageLoading(image.id)" />
         </template>
      </v-img>
   </v-card>
</template>

<script setup lang="ts">
import ImageLoader from '@/components/chat/ImageLoader.vue';
import { onUnmounted, watchEffect, toRef } from 'vue';
import { loadPreviewbyFullpath } from '@/services/message';
import { storeToRefs } from 'pinia';
import { useLoadingStore } from '@/stores/loading';
import { useMessagesStore } from '@/stores/messages';
import { VImg, VCard } from 'vuetify/components';
import { MessageContentWithPreview } from '@/stores/messages';
import { computed } from 'vue';
import { maxMessageMedia } from '@/globals';

export type ImageWithPreviewURL = MessageContentWithPreview['attachments'][number];

const props = withDefaults(defineProps<{
   image: ImageWithPreviewURL;
   width?: string | number | VCard['width'],
   maxHeight?: string | number | VCard['maxHeight'];
   height?: string | number | VCard['height'];
   rounded?: string | number | boolean | VCard['rounded'];
   loader?: InstanceType<typeof ImageLoader>['$props'];
   alt?: string | VImg['alt'];
   aspectRatio?: VImg['aspectRatio'];
}>(), {
   maxHeight: maxMessageMedia.h,
   height: 'auto',
   rounded: 0,
})
const emit = defineEmits<{
   open: [],
   loaded: []
}>();
const { setAttachPreviewURL } = useMessagesStore();
const { getUploadingStateById } = storeToRefs(useLoadingStore());
watchEffect(async () => {
   try {
      if (!props.image.raw.previewURL) {
         const previewURL = await loadPreviewbyFullpath(props.image.raw);
         setAttachPreviewURL(toRef(props, 'image'), previewURL as string);
      }
   } catch (e) { }
});
const cancelImageLoading = (imgId: string) => {
   getUploadingStateById.value(imgId)?.task.cancel();
};

const calcImageSize = computed(() => {
   const { w, h } = props.image.raw.sizes!;
   const ar = w / h;
   if (w > maxMessageMedia.w || h > maxMessageMedia.h) {
      return w > h ? { w: maxMessageMedia.w, h: maxMessageMedia.w / ar } : { h: maxMessageMedia.h, w: maxMessageMedia.h * ar }
   }
   else return { w, h }
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
   user-select: none !important;
   display: flex;
   justify-content: center;
   max-width: 100%;
   max-height: 100%;
   :deep(img) {
      user-select: text !important;
      pointer-events: none !important;
   }
}
</style>
