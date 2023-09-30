<template>
	<div
		:class="{ 'self justify-end': self, 'ml-6': xs && self, 'mr-6': xs && !self }"
		class="message d-flex"
		@contextmenu.prevent="emit('contextmenu', $event)">
		<v-avatar
			size="30px"
			:image="sender.photoURL || defaultAvatar"
			:class="self ? 'ml-2' : 'mr-2'"
			class="sender__avatar"
			@click="openUserProfile"
			:title="setUserDisplayName(sender)" />

		<v-card
			:min-width="smAndUp ? '120px' : '100px'"
			:max-width="smAndUp ? '650px' : xs ? '80%' : '420px'"
			density="compact"
			class="message__card"
			:class="self ? 'self bg-light-blue-darken-3' : ''"
			variant="tonal">
			<v-card-title v-if="content.type === 'text'" class="message__head d-flex flex-row align-center">
				<small class="sender__name text-truncate" @click="openUserProfile"> {{ setUserDisplayName(sender) }}</small>
			</v-card-title>

			<v-card-text
				class="message__content pb-1 pr-3"
				:class="{ 'pl-2 pt-2': content.type === 'file', 'pl-3 pt-3': content.type === 'media' }">
				<component
					:is="messageComponent"
					v-bind="{ content }"
					:class="{ 'pr-2 pr-sm-3': content.type === 'file' }"
					@openInOverlay="(imgId: MediaAttachment['id']) => emit('openInOverlay', imgId)" />

				<small
					:class="{ 'mt-2': content.type !== 'file' }"
					class="message__time d-block text-end mt-1 mt-sm-2 text-truncate"
					>{{
						d(created_at, { key: formatDate(created_at) }) +
						(updated_at ? ` (upd. ${d(updated_at, { key: formatDate(updated_at) })})` : '')
					}}</small
				>
			</v-card-text>
		</v-card>

		<span class="highlighter"></span>
	</div>
</template>

<script setup lang="ts">
import MediaMessage from '@/components/chat/messages/media/MediaMessage.vue';
import FileMessage from '@/components/chat/messages/file/FileMessage.vue';
import TextMessage from '@/components/chat/messages/text/TextMessage.vue';
import { useDisplay } from 'vuetify';
import { computed } from 'vue';
import { useRouter } from 'vue-router/auto';
import { formatDate } from '@/utils/filters/messages';
import { defaultAvatar } from '@/global-vars';
import { Message, MediaAttachment } from '@/services/message';
import { useI18n } from 'vue-i18n';
import { setUserDisplayName } from '@/utils/user';

interface MessageItemProps {
	content: Message['content'];
	sender: Message['sender'];
	created_at: Message['created_at'];
	updated_at: Message['updated_at'];
	self?: boolean;
}

const props = withDefaults(defineProps<MessageItemProps>(), {
	self: false,
	active: false,
});
const emit = defineEmits<{
	openInOverlay: [imgId: MediaAttachment['id']];
	contextmenu: [event: MouseEvent];
}>();

const { d } = useI18n();
const { xs, smAndUp } = useDisplay();
const { push } = useRouter();

const messageComponent = computed(() =>
	props.content.type === 'media' ? MediaMessage : props.content.type === 'file' ? FileMessage : TextMessage
);
const openUserProfile = () => {
	push({ name: '/user/[userId]', params: { userId: props.sender.uid } });
};
</script>

<style lang="scss" scoped>
.message {
	user-select: text;
	position: relative;
	& > :deep(.highlighter) {
		display: block;
		visibility: hidden;
		position: absolute;
		top: 0;
		bottom: 0;
		left: -50%;
		right: -25%;
		z-index: -1;
		background-color: rgb(255, 255, 255);
		opacity: 0;
	}
	&__content {
		line-height: 1.5;
	}
	&__time {
		font-size: 0.55rem;
	}
	/* Code for Firefox */
	::-moz-selection,
	::selection {
		background-color: #1a237e;
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
		user-select: none;
		:deep(img) {
			pointer-events: none;
		}
	}
}
.self {
	.sender__avatar {
		order: 2 !important;
	}
	.message__card {
		order: 1 !important;
	}
}
</style>
