<template>
	<div :class="{ self }" class="message d-flex">
		<v-avatar size="30px" :image="sender.photoURL" :class="self ? 'ml-2' : 'mr-2'" class="sender__avatar"
			@click="$router.push({ name: 'user-id', params: { id: sender.id } })" />
		<v-card min-width="100px" max-width="650px" max-height="65vh" density="compact" class="message__card mb-4"
			:class="self ? 'bg-light-blue-darken-3' : ''" variant="tonal">
			<v-card-title v-if="type !== 'media'" class="message__head d-flex flex-row align-center">
				<small class="sender__name" @click="$router.push({ name: 'user-id', params: { id: sender.id } })">{{
					sender.displayName }}</small>
			</v-card-title>
			<v-card-text class="message__content pb-1">
				<p class="message__text" :class="type !== 'text' && content.subtitle ? 'mb-4' : ''">
					{{ type === 'text' ? content.text : type === 'media' ? content.subtitle : '' }}</p>
				<v-card v-if="type === 'media'" class="image__wrapper my-2" variant="text" @click="openInOverlay = true"
					:style="`width: ${content.image.sizes.w}px; height: ${content.image.sizes.h}px;`" style="max-width:100%">
					<!-- <canvas></canvas> -->
					<div v-if="!loadMessageImage" class="d-flex align-center justify-center fill-height">
						<v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
					</div>
					<v-img v-else :src="loadMessageImage" :alt="content.subtitle" :width="content.image.sizes.w"
						style="position: relative; top: 50%; transform: translateY(-50%);">
					</v-img>
				</v-card>
				<div v-else-if="type === 'file'" class="d-flex align-center">
					<div class="file-icon">
						<v-icon icon="mdi-file" size="60px" class="" />
						<span class="file-icon-ext font-weight-black text-brown-darken-4">
							{{ content.file.fullname.split('.')[content.file.fullname.split('.').length - 1] }}</span>
					</div>
					<div class="ml-2 text-subtitle-1 font-weight-medium">
						<p class="text-subtitle-1">{{ content.file.fullname }}</p>
						<p class="mt-1 text-body-2">{{ formatFileSize }}</p>
					</div>
				</div>
				<i18n-d tag="small" :value="created_at" :format="messagesDate" scope="global" locale="ru-RU"
					class="message__time mt-2" />
			</v-card-text>
		</v-card>
		<v-overlay v-model="openInOverlay" v-if="type === 'media'" content-class="image-overlay"
			class="fullsize-image__dialog" transition="scale-transition">
			<v-card class="fullsize-image__wrapper" variant="text" max-width="80vw" max-height="90vh"
				style="overflow: hidden;">
				<v-img :src="loadMessageImage" :alt="content.subtitle" :width="content.image.sizes.w"
					:height="content.image.sizes.h">
					<template v-slot:placeholder>
						<div class="d-flex align-center justify-center fill-height">
							<v-progress-circular color="grey-lighten-4" indeterminate />
						</div>
					</template>
				</v-img>
			</v-card>
			<div class="actions__panel">
				<v-btn class="download__btn" icon="mdi-download" variant="text"
					:href="loadMessageImage || content.image.downloadURL" :download="content.image.fullname || 'image.png'"
					title="Download" />
				<v-btn class="close__btn" icon="mdi-close" variant="text" @click="openInOverlay = false;" title="Close" />
			</div>
		</v-overlay>
	</div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useDateFormat } from '@/utils/dateFormat';
import { computedAsync } from '@vueuse/core';
import { ref as storageRef, getBlob } from 'firebase/storage';
import { useFirebaseStorage } from 'vuefire';

const { messagesDateFormat } = useDateFormat();

const props = defineProps({
	self: {
		type: Boolean,
		default: false,
	},
	type: {
		type: String,
		default: 'text',
	},
	sender: {
		type: Object,
		required: true,
	},
	content: {
		type: Object,
		required: true,
	},
	created_at: {
		required: true,
		type: [Date, String],
	}
});
const openInOverlay = ref(false);
const messagesDate = computed(() => messagesDateFormat(props.created_at));
const loadMessageImage = computedAsync(async () => {
	if (props.type === 'media' && props.content && props.content.image) {
		const storage = useFirebaseStorage();
		const blobFile = await getBlob(storageRef(storage, props.content.image.fullpath));
		return URL.createObjectURL(blobFile);
	}
	return;
});
onUnmounted(() => {
	if (props.content.image && props.content.image.blob instanceof Blob) {
		URL.revokeObjectURL(props.content.image.blob);
	}
});
const formatFileSize = computed(() => {
	if (props.content.file && props.content.file.size) {
		return props.content.file.size < 1024 ? props.content.file.size + ' bytes' :
			props.content.file.size < 1048576 ? (props.content.file.size / 1024).toPrecision(4) + ' KB' :
				(props.content.file.size / 1048576).toPrecision(4) + ' MB';
	}
});
</script>

<style lang="scss" scoped>
.message {
	&__card {
		@media(max-width: 720px) {
			max-height: 320px !important;
		}
	}
	&__head {}
	&__content {
		line-height: 1.5;
	}
	&__time {
		display: block;
		text-align: end;
		font-size: 0.55rem;
	}
}
.sender {
	&__name {
		cursor: pointer;
		font-size: 0.7rem;
		line-height: 1.55;
		font-weight: 600;
		letter-spacing: 0.03rem;
	}
	&__avatar {
		cursor: pointer;
	}
}
.self {
	justify-content: flex-end;
	.sender__avatar {
		order: 2 !important;
	}
	.message__card {
		order: 1 !important;
	}
}
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
.close__btn {}
.download__btn {}
.file-icon {
	position: relative;
	&-ext {
		font-size: 1.1rem;
		display: inline-block;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -30%);
	}
}
</style>