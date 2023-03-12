<template>
	<v-card class="image__wrapper" variant="text" @click="openInOverlay"
		:style="`width: ${image.sizes.w}px; height: ${image.sizes.h}px;`">
		<!-- <canvas></canvas> -->
		<div v-if="!image.previewURL" class="d-flex align-center justify-center fill-height">
			<v-progress-circular color="grey-lighten-4" indeterminate />
		</div>
		<v-img v-else :src="image.previewURL" :alt="alt | image.fullname" :width="image.sizes.w" />
	</v-card>
</template>

<script setup lang="ts">
import { onUnmounted, watchEffect, toRef } from 'vue';
import { ref as storageRef, getBlob } from 'firebase/storage';
import { useFirebaseStorage } from 'vuefire';

const props = defineProps<{
	image: object;
	alt?: string;
}>();
const emit = defineEmits<{
	(e: 'open', image: object): void,
}>();

const image = toRef(props, 'image');

watchEffect(async () => {
	if (image.value) {
		try {
			const storage = useFirebaseStorage();
			const blobFile = await getBlob(storageRef(storage, image.value.fullpath));
			image.value.previewURL = URL.createObjectURL(blobFile);
		} catch (e: unknown) {
			console.error(e);
		}
	}
});

const openInOverlay = () => {
	if (image.value.previewURL) {
		emit('open', image.value);
	}
}
onUnmounted(() => {
	if (image.value.previewURL) {
		URL.revokeObjectURL(image.value.previewURL);
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