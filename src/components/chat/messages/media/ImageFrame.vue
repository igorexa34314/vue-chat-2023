<template>
   <v-card v-if="image" class="image__wrapper" variant="text"
      @click="image.previewURL || image?.downloadURL ? emit('open') : undefined" width="100%" :height="height"
      :max-height="maxHeight" :rounded="rounded" v-ripple="false">
      <!-- <canvas></canvas> -->
      <v-img :lazy-src="image.thumbnail" :src="image.previewURL || image.downloadURL" :alt="alt || image.fullname"
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
import { onUnmounted, watchEffect, toRef } from 'vue';
import { loadPreviewbyFullpath } from '@/services/message';
import { storeToRefs } from 'pinia';
import { useLoadingStore } from '@/stores/loading';
import { useMessagesStore } from '@/stores/messages';
import { VImg, VCard } from 'vuetify/components';
import { MessageAttachment } from '@/types/db/MessagesTable';
import { Message, MessageContentWithPreview } from '@/stores/messages';

// export type ImageWithPreviewURL = { previewURL: string } & (MediaMessage['images'][number] | FileMessage['files'][number]);

const props = withDefaults(defineProps<{
   image: Message['content']['attachments'];
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
   (e: 'loaded'): void;
}>();
const { setMediaPreviewURL } = useMessagesStore();
const { getUploadingStateById } = storeToRefs(useLoadingStore());
watchEffect(async () => {
   try {
      if (!props.image.previewURL) {
         const previewURL = await loadPreviewbyFullpath(props.image.raw as MessageAttachment) || '';
         setMediaPreviewURL(toRef(props, 'image'), previewURL);
      }
   } catch (e) { }
});
const cancelImageLoading = (imgId: string) => {
   getUploadingStateById.value(imgId)?.task.cancel();
};

const imageLoaded = () => {
   if (props.image.previewURL) {
      emit('loaded');
   }
};
onUnmounted(() => {
   if (props.image.previewURL) {
      URL.revokeObjectURL(props.image.previewURL);
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
