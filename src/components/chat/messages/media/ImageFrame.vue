<template>
	<v-card class="image__wrapper" variant="text" @click="openInOverlay"
		:style="`width: ${image?.sizes.w}px; height: ${image?.sizes.h}px;`">
		<!-- <canvas></canvas> -->
		<v-img :src="previewURL" :alt="alt || image?.fullname" :width="image?.sizes.w">
			<template #placeholder>
				<div class="d-flex align-center justify-center fill-height">
					<v-progress-circular color="grey-lighten-4" indeterminate />
				</div>
			</template>
		</v-img>
	</v-card>
</template>

<script setup lang="ts">
import { onUnmounted, watchEffect, ref, PropType, Ref } from 'vue';
import { ref as storageRef, getBlob } from 'firebase/storage';
import { useFirebaseStorage } from 'vuefire';
import type { MediaMessage } from '@/types/db/MessagesTable';

export type ImageWithPreviewURL = { previewURL: string } & MediaMessage['images'][number];

const props = defineProps({
	image: Object as PropType<MediaMessage['images'][number]>,
	alt: String,
});
const emit = defineEmits<{
	(e: 'open', image: ImageWithPreviewURL): void,
}>();

const previewURL = ref('');

watchEffect(async () => {
	if (props.image) {
		try {
			const storage = useFirebaseStorage();
			const blobFile = await getBlob(storageRef(storage, props.image.fullpath));
			previewURL.value = URL.createObjectURL(blobFile);
		} catch (e: unknown) {
			console.error(e);
		}
	}
});

const openInOverlay = () => {
	if (previewURL.value) {
		emit('open', { ...props.image, previewURL: previewURL.value } as ImageWithPreviewURL);
	}
}
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
	&:deep(img) {
		max-width: 100%;
		display: block;
		height: auto;
	}
}
</style>