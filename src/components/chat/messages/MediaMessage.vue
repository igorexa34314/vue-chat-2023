<template>
	<v-card class="image__wrapper" variant="text" @click="openInOverlay"
		:style="`width: ${image.sizes.w}px; height: ${image.sizes.h}px;`" style="max-width:100%">
		<!-- <canvas></canvas> -->
		<div v-if="!imageURL" class="d-flex align-center justify-center fill-height">
			<v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
		</div>
		<v-img v-else :src="imageURL" :alt="alt | image.fullname" :width="image.sizes.w"
			style="position: relative; top: 50%; transform: translateY(-50%);">
		</v-img>
	</v-card>
	<v-overlay v-model="showOverlay" content-class="image-overlay" class="fullsize-image__dialog"
		transition="scale-transition">
		<v-card class="fullsize-image__wrapper" variant="text" max-width="80vw" max-height="90vh" style="overflow: hidden;">
			<v-img :src="imageURL" :alt="alt || image.fullname" :width="image.sizes.w" :height="image.sizes.h">
				<template v-slot:placeholder>
					<div class="d-flex align-center justify-center fill-height">
						<v-progress-circular color="grey-lighten-4" indeterminate />
					</div>
				</template>
			</v-img>
		</v-card>
		<div class="actions__panel">
			<v-btn class="download__btn" icon="mdi-download" variant="text" :href="imageURL || image.downloadURL"
				:download="image.fullname || 'image.png'" title="Download" />
			<v-btn class="close__btn" icon="mdi-close" variant="text" @click="showOverlay = false;" title="Close" />
		</div>
	</v-overlay>
</template>

<script setup>
import { ref, onUnmounted, watchEffect } from 'vue';
import { ref as storageRef, getBlob } from 'firebase/storage';
import { useFirebaseStorage } from 'vuefire';

const props = defineProps({
	image: {
		type: Object,
		required: true,
	},
	alt: {
		type: String,
	}
});

const showOverlay = ref(false);
const imageURL = ref('');

const openInOverlay = () => {
	if (imageURL.value) {
		showOverlay.value = true;
	}
}

const loadMessageImage = async () => {
	if (props.image && Object.keys(props.image).length) {
		const storage = useFirebaseStorage();
		const blobFile = await getBlob(storageRef(storage, props.image.fullpath));
		imageURL.value = URL.createObjectURL(blobFile);
	}
};
watchEffect(loadMessageImage);

onUnmounted(() => {
	if (props.image && props.image.blob instanceof Blob) {
		URL.revokeObjectURL(imageURL.value);
	}
});
</script>

<style lang="scss" scoped>
.image__wrapper {
	&:deep(img) {
		max-width: 100%;
		display: block;
		height: auto;
	}
}
.fullsize-image__dialog :deep(.v-overlay__scrim) {
	background: #000000;
	opacity: 90%;
}
:global(.image-overlay) {
	pointer-events: none;
	position: fixed;
	width: 100vw;
	min-height: 100vh;
	margin: 0 !important;
	display: flex;
	align-items: center;
}
.fullsize-image__wrapper {
	pointer-events: all;
	// transform: translate(-50%, -50%);
	margin: 0 auto;
	& img {
		display: block;
		max-width: 100%;
		height: auto;
		object-fit: contain;
	}
}
.actions__panel {
	pointer-events: all;
	padding: 10px 2em;
	top: 0;
	left: 0;
	right: 0;
	position: fixed;
	display: flex;
	column-gap: 0.5rem;
	justify-content: flex-end;
}
</style>