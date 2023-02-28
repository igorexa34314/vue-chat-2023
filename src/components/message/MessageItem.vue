<template>
	<div :class="{ self }" class="message d-flex">
		<v-avatar size="30px" :image="sender.photoURL" :class="self ? 'ml-2' : 'mr-2'" class="sender__avatar"
			@click="$router.push({ name: 'user-id', params: { id: sender.id } })" />
		<v-card min-width="100px" max-width="650px" max-height="300px" density="compact" class="message__card mb-4"
			:class="self ? 'bg-light-blue-darken-3' : ''" variant="tonal">
			<v-card-title v-if="type !== 'media'" class="message__head d-flex flex-row align-center">
				<small class="sender__name" @click="$router.push({ name: 'user-id', params: { id: sender.id } })">{{
					sender.displayName }}</small>
			</v-card-title>
			<v-card-text class="message__content pb-1">
				<p class="message__text" :class="type !== 'text' && content.subtitle ? 'mb-4' : ''">
					{{ type === 'text' ? content.text : type === 'media' ? content.subtitle : '' }}</p>
				<v-card v-if="type === 'media' && displayBlobFormat" class="image__wrapper my-2" variant="text"
					@click="openInOverlay = true">
					<!-- <canvas></canvas> -->
					<v-img :src="displayBlobFormat" :alt="content.subtitle" :width="content.image.sizes.w"
						:height="content.image.sizes.h">
						<template v-slot:placeholder>
							<div class="d-flex align-center justify-center fill-height">
								<v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
							</div>
						</template>
					</v-img>
				</v-card>
				<i18n-d tag="small" :value="created_at" :format="messagesDate" scope="global" locale="ru-RU"
					class="message__time mt-2" />
			</v-card-text>
		</v-card>
		<v-overlay v-model="openInOverlay" v-if="type === 'media'" content-class="image-overlay"
			class="fullsize-image__dialog" transition="scale-transition">
			<v-card class="fullsize-image__wrapper" variant="text" max-width="80vw" max-height="90vh"
				style="overflow: hidden;">
				<v-img :src="displayBlobFormat" :alt="content.subtitle" :width="content.image.sizes.w"
					:height="content.image.sizes.h">
					<template v-slot:placeholder>
						<div class="d-flex align-center justify-center fill-height">
							<v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
						</div>
					</template>
				</v-img>
			</v-card>
			<div class="actions__panel">
				<v-btn class="download__btn" icon="mdi-download" variant="text" :href="displayBlobFormat"
					:download="(content.image.name + '.' + content.image.ext) || 'image.jpeg'" title="Download" />
				<v-btn class="close__btn" icon="mdi-close" variant="text" @click="openInOverlay = false;" title="Close" />
			</div>
		</v-overlay>
	</div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useDateFormat } from '@/utils/dateFormat';

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
const displayBlobFormat = computed(() => {
	if (props.content.image && props.content.image.blob instanceof Blob) {
		return URL.createObjectURL(props.content.image.blob)
	}
	return null;
});
const messagesDate = computed(() => messagesDateFormat(props.created_at));
onUnmounted(() => {
	if (props.content.image && props.content.image.blob instanceof Blob) {
		URL.revokeObjectURL(props.content.image.blob);
	}
});
</script>

<style lang="scss" scoped>
.message {
	&__card {}
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
</style>