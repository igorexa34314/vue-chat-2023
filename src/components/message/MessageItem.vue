<template>
	<div :class="{ self }" class="message d-flex" v-if="!isLoading">
		<v-avatar size="30px" :image="sender.photoURL" :class="self ? 'ml-2' : 'mr-2'" class="sender__avatar"
			@click="$router.push({ name: 'user-id', params: { id: sender.id } })" />
		<v-card min-width="100px" max-width="650px" density="compact" class="message__card mb-4"
			:class="self ? 'bg-light-blue-darken-3' : ''" variant="tonal">
			<v-card-title v-if="type !== 'media'" class="message__head d-flex flex-row align-center">
				<small class="sender__name" @click="$router.push({ name: 'user-id', params: { id: sender.id } })">{{
					sender.displayName }}</small>
			</v-card-title>
			<v-card-text class="message__content pb-1">
				<p class="message__text" :class="type !== 'text' && content.subtitle ? 'mb-4' : ''">
					{{ type === 'text' ? content.text : type === 'media' ? content.subtitle : '' }}</p>
				<v-card v-if="type === 'media'" max-width="480px" max-height="480px" class="image__wrapper my-2" variant="text"
					@click="openInOverlay = true">
					<img :src="content.imageURL" :alt="content.subtitle" />
				</v-card>
				<i18n-d tag="small" :value="created_at" :format="messagesDate" scope="global" locale="ru-RU"
					class="message__time mt-2" />
			</v-card-text>
		</v-card>
		<v-dialog v-model="openInOverlay" v-if="type === 'media'" content-class="image-overlay"
			class="fullsize-image__dialog">
			<v-card class="fullsize-image__wrapper" variant="text" max-width="80vw" max-height="90vh"
				style="overflow: hidden;">
				<img :src="content.imageURL" :alt="content.subtitle" />
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDateFormat } from '@/utils/dateFormat';
import { useImage } from '@vueuse/core';

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
if (props.type === 'media') {
	const { isLoading } = useImage({ src: props.content.imageURL });
} else { const isLoading = ref(true); }
const openInOverlay = ref(false);

const messagesDate = computed(() => messagesDateFormat(props.created_at));
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
.image__wrapper img {
	display: block;
	max-width: 100%;
	height: auto;
}
.fullsize-image__dialog :deep(.v-overlay__scrim) {
	background: #000000;
	opacity: 55%;
}
:global(.image-overlay) {
	margin: 0 !important;
	display: block;
	width: auto !important;
}
.fullsize-image__wrapper {
	margin: 0 auto;
	& img {
		display: block;
		max-width: 100%;
		height: auto;
		object-fit: contain;
	}
}
</style>