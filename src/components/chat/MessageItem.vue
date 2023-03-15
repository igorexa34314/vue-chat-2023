<template>
	<div :class="{ self }" class="message d-flex">
		<v-avatar size="30px" :image="sender.photoURL || defaultAvatar" :class="self ? 'ml-2' : 'mr-2'"
			class="sender__avatar" @click="$router.push({ name: 'user-id', params: { id: sender.id } })"
			:title="sender.displayName" />
		<v-card min-width="100px" max-width="650px" max-height="65vh" density="compact" class="message__card mb-4"
			:class="self ? 'bg-light-blue-darken-3' : ''" variant="tonal">
			<v-card-title v-if="type === 'text'" class="message__head d-flex flex-row align-center">
				<small class="sender__name" @click="$router.push({ name: 'user-id', params: { id: sender.id } })">{{
					sender.displayName }}</small>
			</v-card-title>
			<v-card-text class="message__content pb-1">
				<p class="message__text" :class="type !== 'text' && (<MediaContent>content).subtitle ? 'mb-4' : ''">
					{{ type === 'text' ? (<TextContent>content).text : type === 'media' ?
						(<MediaContent | FileContent>content).subtitle : '' }}</p>

				<MediaMessage v-if="type === 'media'" :images="(<MediaContent>content).images"
					:alt="(<MediaContent>content).subtitle" class="my-2" />

				<FileMessage v-else-if="type === 'file'" :files="(<FileContent>content).files" class="pr-3" />

				<i18n-d tag="small" :value="created_at" :format="messagesDate" scope="global" locale="ru-RU"
					class="message__time mt-2" />
			</v-card-text>
		</v-card>
	</div>
</template>

<script setup lang="ts">
import MediaMessage from '@/components/chat/messages/media/MediaMessage.vue';
import FileMessage from '@/components/chat/messages/file/FileMessage.vue';
import { computed } from 'vue';
import { useDateFormat } from '@/utils/dateFormat';
import type { Message } from '@/stores/messages';
import type { TextMessage as TextContent, MediaMessage as MediaContent, FileMessage as FileContent } from '@/types/db/MessagesTable';

interface MessageItemProps {
	type: Message['type'];
	content: Message['content'];
	sender: Message['sender'];
	created_at: Message['created_at'];
	self?: boolean
};

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;

const { messagesDateFormat } = useDateFormat();

const props = withDefaults(defineProps<MessageItemProps>(), {
	self: false,
});
const messagesDate = computed(() => messagesDateFormat(props.created_at as Date));
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
.close__btn {}
.download__btn {}
</style>