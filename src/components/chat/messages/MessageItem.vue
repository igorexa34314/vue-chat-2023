<template>
	<div :class="{ self }" class="message d-flex">
		<v-avatar size="30px" :image="sender.photoURL || defaultAvatar" :class="self ? 'ml-2' : 'mr-2'"
			class="sender__avatar" @click="push({ name: 'user-id', params: { id: sender.id } })"
			:title="sender.displayName" />

		<v-card min-width="120px" max-width="850px" density="compact" class="message__card mb-4"
			:class="self ? 'bg-light-blue-darken-3' : ''" variant="tonal">

			<v-card-title v-if="type === 'text'" class="message__head d-flex flex-row align-center">
				<small class="sender__name" @click="push({ name: 'user-id', params: { id: sender.id } })">
					{{ sender.displayName }}</small>
			</v-card-title>

			<v-card-text class="message__content pb-1"
				:class="type === 'file' ? 'pl-2 pt-2' : type === 'media' ? 'pl-4 pt-4' : ''">

				<component :is="messageComponent" v-bind="{ content }" :class="{ 'pr-3': type === 'file' }" />

				<i18n-d tag="small" :value="created_at" :format="messagesDateFormat(created_at as Date)" scope="global"
					locale="ru-RU" :class="{ 'mt-2': type !== 'file' }" class="message__time" />
			</v-card-text>
		</v-card>
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
import type { Message } from '@/stores/messages';

interface MessageItemProps {
	type: Message['type'];
	content: Message['content'];
	sender: Message['sender'];
	created_at: Message['created_at'];
	self?: boolean
};

const messageComponent = computed(() => props.type === 'media' ? MediaMessage : props.type === 'file' ? FileMessage : TextMessage);

const { push } = useRouter();
const props = withDefaults(defineProps<MessageItemProps>(), {
	self: false,
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