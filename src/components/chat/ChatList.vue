<template>
	<v-list density="comfortable" class="chat-list mt-3 pr-2">
		<v-list-item
			v-for="chat of chats"
			:key="chat.id"
			:title="setChatName(chat)"
			:to="{ name: '/chat/[chatId]', params: { chatId: chat.id } }"
			class="py-3 mb-3"
			draggable="false">
			<template #prepend>
				<v-avatar>
					<v-img :src="setChatAvatar(chat)">
						<template #error>
							<v-img :src="defaultAvatar" />
						</template>
					</v-img>
				</v-avatar>
			</template>
		</v-list-item>
	</v-list>
</template>

<script setup lang="ts">
import { defaultAvatar } from '@/global-vars';
import { setChatName, setChatAvatar } from '@/utils/chat';
import type { ChatInfo } from '@/services/chat';

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
