<template>
   <v-card v-if="image" class="image__wrapper" variant="text"
      @click="previewURL || image?.downloadURL ? emit('open') : undefined" width="100%" :height="height"
      :max-height="maxHeight" :rounded="rounded" v-ripple="false">
      <!-- <canvas></canvas> -->
      <v-img :lazy-src="image.thumbnail" :src="previewURL || image?.downloadURL" :alt="alt || image.fullname"
         :width="image.sizes?.w" eager @load="imageLoaded" cover draggable="false">
         <template #placeholder>
            <ImageLoader v-bind="loader" :model-value="getUploadingStateById(image.id)?.progress"
               @cancel="cancelImageLoading(image?.id as string)" />
         </template>
      </v-img>
   </v-card>
</template>

<script setup lang="ts">
import ImageLoader from '@/components/chat/ImageLoader.vue';
import { useMessagesStore } from '@/stores/messages';
import { onUnmounted, watchEffect, ref } from 'vue';
import { loadImagebyFullpath } from '@/services/message';
import { storeToRefs } from 'pinia';
import { useLoadingStore } from '@/stores/loading';
import { VImg, VCard } from 'vuetify/components';
import type { MediaMessage, FileMessage } from '@/stores/messages';

export type ImageWithPreviewURL = { previewURL: string } & (MediaMessage['images'][number] | FileMessage['files'][number]);

const props = withDefaults(defineProps<{
   image: MediaMessage['images'][number] | FileMessage['files'][number];
   maxHeight?: string | number | VCard['maxHeight'];
   height?: string | number | VCard['height'];
   rounded?: string | number | boolean | VCard['rounded'];
   loader?: InstanceType<typeof ImageLoader>['$props'];
   alt?: string | VImg['alt'];
}>(), {
   maxHeight: '280px',
   height: 'auto',
   rounded: 0
})
const emit = defineEmits<{
   (e: 'open'): void;
   (e: 'loaded', image: ImageWithPreviewURL): void;
}>();
const { getUploadingStateById } = storeToRefs(useLoadingStore());
const previewURL = ref('');

watchEffect(async () => {
   try {
      previewURL.value = await loadImagebyFullpath(props.image as MediaMessage['images'][number]) || '';
   } catch (e) { }
});
const cancelImageLoading = (imgId: string) => {
   getUploadingStateById.value(imgId)?.task.cancel();
};

const imageLoaded = () => {
   if (previewURL.value) {
      emit('loaded', { ...props.image, previewURL: previewURL.value });
   }
};
onUnmounted(() => {
   if (previewURL.value) {
      URL.revokeObjectURL(previewURL.value);
   }
});
</script>

<style lang="scss" scoped>
.image__wrapper {
   display: flex;
   justify-content: center;
   max-width: 100%;
   max-height: 100%;

   :deep(img) {
      user-select: none !important;
      pointer-events: none !important;
   }
}
</style>
