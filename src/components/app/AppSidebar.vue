<template>
	<v-navigation-drawer v-model="drawer" width="320" location="left" class="pa-3">
		<v-card
			v-if="userInfo && Object.keys(userInfo).length"
			class="user-info py-1 bg-blue-grey-darken-4"
			density="compact"
			variant="text"
			@click="push('/profile')"
			draggable="false">
			<template #prepend>
				<v-avatar :image="userInfo.photoURL || defaultAvatar" />
			</template>
			<template #title>{{ userInfo.displayName || 'Unknown' }}</template>
		</v-card>

		<v-divider thickness="2" class="mt-2" />

		<div v-if="loading"><page-loader /></div>

		<div v-else-if="!getUserChatsInfo.length" class="mt-4 pa-3">
			<p class="text-h6 text-center">No chats</p>
		</div>

		<v-list v-else density="comfortable" class="chat-list mt-3">
			<v-list-item
				v-for="chat of getUserChatsInfo"
				:key="chat.id"
				:title="setChatName(chat)"
				:prepend-avatar="setChatAvatar(chat)"
				@click="push({ name: '/chat/[chatId]', params: { chatId: chat.id } })"
				class="py-3 mb-3"
				draggable="false" />
		</v-list>
	</v-navigation-drawer>
</template>

<script setup lang="ts">
import messages from '@/utils/messages.json';
import { ref } from 'vue';
import { computedAsync, useVModel } from '@vueuse/core';
import { getChatInfoById, ChatInfo } from '@/services/chat';
import { storeToRefs } from 'pinia';
import { useSnackbarStore } from '@/stores/snackbar';
import { useUserdataStore } from '@/stores/userdata';
import { setChatName, setChatAvatar } from '@/utils/chat';
import { defaultAvatar } from '@/globals';
import { useRouter } from 'vue-router/auto';

const { showMessage } = useSnackbarStore();
const { push } = useRouter();
const { getUChats: userChats, getUInfo: userInfo } = storeToRefs(useUserdataStore());
const loading = ref(true);

const props = withDefaults(
	defineProps<{
		modelValue?: boolean;
	}>(),
	{
		modelValue: false,
	}
);

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
}>();
const drawer = useVModel(props, 'modelValue', emit);

// fetchChatsInfo
const getUserChatsInfo = computedAsync(
	async () => {
		if (userChats.value?.length) {
			return (await Promise.all(userChats.value.map(getChatInfoById))) as ChatInfo[];
		}
		return [];
	},
	[],
	{
		evaluating: loading,
		onError: e => {
			console.error(e);
			showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
		},
	}
);
</script>

<style lang="scss" scoped>
.user-info,
.chat-list {
	:deep(img) {
		user-select: text;
		pointer-events: text;
	}
}
</style>
