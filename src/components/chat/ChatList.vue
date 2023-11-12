<template>
	<v-list density="comfortable" class="chat-list mt-3 pr-2">
		<v-list-item
			v-for="chat of chats"
			:key="chat.id"
			:title="setChatName(chat)"
			:prepend-avatar="setChatAvatar(chat)"
			:to="{ name: '/chat/[chatId]', params: { chatId: chat.id } }"
			class="py-3 mb-3"
			draggable="false" />
	</v-list>
</template>

<script setup lang="ts">
import type { ChatInfo } from '@/services/chat';
import { setChatName, setChatAvatar } from '@/utils/chat';

const { chats } = defineProps<{
	chats: ChatInfo[];
}>();
</script>

<style scoped lang="scss">
.chat-list {
	:deep(img) {
		user-select: text;
		pointer-events: text;
	}
}
</style>
