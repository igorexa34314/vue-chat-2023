<template>
	<v-navigation-drawer v-model="drawer" width="320" location="left" class="pa-3">
		<!-- <div v-if="!userdata || !Object.keys(userdata.info).length || !userChatsInfo || !userChatsInfo.length">
			<page-loader />
		</div> -->
		<v-card v-if="userdata?.info && Object.keys(userdata.info).length" class="py-1 bg-blue-grey-darken-4"
			density="compact" variant="text" to="/profile">
			<template v-slot:prepend>
				<v-avatar :image="userdata.info.photoURL || defaultAvatar" />
			</template>
			<template v-slot:title>{{ userdata.info.displayName || 'Unknown' }}</template>
		</v-card>
		<v-divider thickness="2" class="mt-2" />
		<v-list v-if="getUserChatsInfo?.length && !loading" density="comfortable" class="mt-3">
			<v-list-item v-for="chat of getUserChatsInfo" :key="chat.id" :title="setChatName(chat)"
				:prepend-avatar="setChatAvatar(chat)" :to="{ name: 'chat-id', params: { id: chat.id } }" class="py-3 mb-3" />
		</v-list>
		<div v-else-if="loading">
			<page-loader />
		</div>
		<div v-else class="mt-4 pa-3">
			<p class="text-h6 text-center">Чатов нет</p>
		</div>
	</v-navigation-drawer>
</template>

<script setup lang="ts">
import pageLoader from '@/components/UI/pageLoader.vue';
import { ref, inject } from 'vue';
import { computedAsync, useVModel } from '@vueuse/core';
import { useChat } from '@/composables/chat';
import { userDataKey } from '@/injection-keys';
import type { ChatInfo } from '@/composables/chat';

const { getChatInfoById, setChatName, setChatAvatar } = useChat();
const userdata = inject(userDataKey);
const loading = ref(true);

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;

const props = withDefaults(defineProps<{ modelValue: boolean; }>(), { modelValue: false });
const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void,
}>();
const drawer = useVModel(props, 'modelValue', emit);

// fetchChatsInfo
const getUserChatsInfo = computedAsync(async () => {
	try {
		const userChats = userdata?.value?.chats;
		if (userChats?.length) {
			loading.value = true;
			return (await Promise.all(userChats.map(getChatInfoById)) as ChatInfo[]);
		}
	} catch (e: unknown) {
		console.error(e);
	} finally {
		loading.value = false;
	}
});
</script>

<style lang="scss" scoped></style>