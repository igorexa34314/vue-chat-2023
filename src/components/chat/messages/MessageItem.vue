<template>
	<div :class="{ self }" class="message d-flex px-6 py-2" @contextmenu.prevent="emit('contextmenu', $event)">
		<v-avatar size="30px" :image="sender.photoURL || defaultAvatar" :class="self ? 'ml-2' : 'mr-2'"
			class="sender__avatar" @click="push({ name: 'user-userId', params: { userId: sender.id } })"
			:title="sender.displayName" />

		<v-card min-width="120px" max-width="850px" density="compact" class="message__card"
			:class="self ? 'bg-light-blue-darken-3' : ''" variant="tonal">

			<v-card-title v-if="type === 'text'" class="message__head d-flex flex-row align-center">
				<small class="sender__name" @click="push({ name: 'user-userId', params: { userId: sender.id } })">
					{{ sender.displayName }}</small>
			</v-card-title>

			<v-card-text class="message__content pb-1"
				:class="type === 'file' ? 'pl-2 pt-2' : type === 'media' ? 'pl-4 pt-4' : ''">

				<component :is="messageComponent" v-bind="{ content }" :class="{ 'pr-3': type === 'file' }"
					@openInOverlay="(imgId: ImageWithPreviewURL['id']) => emit('openInOverlay', imgId)" />

				<i18n-d tag="small" :value="created_at" :format="messagesDateFormat(created_at as Date)" scope="global"
					locale="ru-RU" :class="{ 'mt-2': type !== 'file' }" class="message__time" />
			</v-card-text>
		</v-card>

		<span class="highlighter"></span>
	</div>
</template>

<script setup lang="ts">
import MediaMessage from '@/components/chat/messages/media/MediaMessage.vue';
import FileMessage from '@/components/chat/messages/file/FileMessage.vue';
import TextMessage from '@/components/chat/messages/text/TextMessage.vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { messagesDateFormat } from '@/utils/filters/messages';
import { defaultAvatar } from '@/utils/globals';
import { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';
import { Message } from '@/stores/messages';

interface MessageItemProps {
	type: Message['type'];
	content: Message['content'];
	sender: Message['sender'];
	created_at: Message['created_at'];
	self?: boolean;
};

const props = withDefaults(defineProps<MessageItemProps>(), {
	self: false,
	active: false
});
const emit = defineEmits<{
	(e: 'openInOverlay', imgId: ImageWithPreviewURL['id']): void;
	(e: 'contextmenu', event: MouseEvent): void;
}>();
const { push } = useRouter();
const messageComponent = computed(() => props.type === 'media' ? MediaMessage : props.type === 'file' ? FileMessage : TextMessage);
</script>

<style lang="scss" scoped>
.message {
	user-select: text !important;
	position: relative;
	& > :deep(.highlighter) {
		background-color: rgb(255, 255, 255);
		opacity: 0;
		display: block;
		visibility: hidden;
		position: absolute;
		top: 0;
		bottom: 0;
		left: -50%;
		right: -25%;
		z-index: -1;
	}
	&._context {
		& > :deep(.highlighter) {
			visibility: visible;
			opacity: 0.2;
		}
	}
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
	::-moz-selection {
		/* Code for Firefox */
		background: #1A237E;
	}

	::selection {
		background: #1A237E;
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
		user-select: none !important;
		:deep(img) {
			pointer-events: none !important;
		}
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
.close__btn {}
.download__btn {}
</style>