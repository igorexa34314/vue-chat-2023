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
import { ref, inject, computed } from 'vue';
import { computedAsync, useVModel } from '@vueuse/core';
import { ChatInfoWithMembersInfo, useChat } from '@/composables/chat';
import { userDataKey, userChatsKey } from '@/injection-keys';

const { getChatInfoById } = useChat();
const userdata = inject(userDataKey);
const userChats = inject(userChatsKey);
const loading = ref(true);

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;
const savedMessages = new URL('@/assets/img/saved-messages.png', import.meta.url).href;

type Drawer = boolean;
const emit = defineEmits<{
	(e: 'update:modelValue', value: Drawer): void,
}>();

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: true,
	},
});
const drawer = useVModel(props, 'modelValue', emit);

// fetchChatsInfo
const getUserChatsInfo = computedAsync(async () => {
	try {
		if (userChats?.value?.length) {
			loading.value = true;
			return (await Promise.all(userChats.value.map(getChatInfoById)) as ChatInfoWithMembersInfo[]);
		}
	} catch (e: unknown) {
		console.error(e);
	} finally {
		loading.value = false;
	}
});
const setChatName = computed(() => (chat: ChatInfoWithMembersInfo) => {
	return chat.type === 'self' ? 'Saved messages' :
		chat.type === 'private' ?
			chat.members.find(m => m.uid !== userdata?.value.info?.uid)?.displayName as string :
			chat.name
})
const setChatAvatar = computed(() => (chat: ChatInfoWithMembersInfo) => {
	return chat.type === 'private' ?
		chat.members.find(m => m.uid !== userdata?.value.info?.uid)?.photoURL as string :
		chat.type === 'self' ? savedMessages :
			defaultAvatar;
});
</script>

<style lang="scss" scoped></style>