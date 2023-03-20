<template>
	<v-navigation-drawer v-model="drawer" width="320" location="left" class="pa-3">
		<!-- <div v-if="!userdata || !Object.keys(userdata.info).length || !userChatsInfo || !userChatsInfo.length">
			<page-loader />
		</div> -->
		<v-card v-if="userInfo && Object.keys(userInfo).length" class="py-1 bg-blue-grey-darken-4" density="compact"
			variant="text" to="/profile">
			<template #prepend>
				<v-avatar :image="userInfo.photoURL || defaultAvatar" />
			</template>
			<template #title>{{ userInfo.displayName || 'Unknown' }}</template>
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
import messages from '@/utils/messages.json';
import { ref } from 'vue';
import { computedAsync, useVModel } from '@vueuse/core';
import { getChatInfoById } from '@/services/chat';
import { storeToRefs } from 'pinia';
import { useSnackbarStore } from '@/stores/snackbar';
import { useUserdataStore } from '@/stores/userdata';
import { setChatName, setChatAvatar } from '@/utils/chat';
import { defaultAvatar } from '@/utils/globals';
import type { ChatInfo } from '@/services/chat';

const { showMessage } = useSnackbarStore();
const { getUChats: userChats, getUInfo: userInfo } = storeToRefs(useUserdataStore());
const loading = ref(true);

const props = withDefaults(defineProps<{ modelValue: boolean; }>(), { modelValue: false });
const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void,
}>();
const drawer = useVModel(props, 'modelValue', emit);

// fetchChatsInfo
const getUserChatsInfo = computedAsync(async () => {
	try {
		if (userChats.value?.length) {
			loading.value = true;
			return (await Promise.all(userChats.value.map(getChatInfoById)) as ChatInfo[]);
		}
	} catch (e: unknown) {
		console.error(e);
		showMessage(messages[e as keyof typeof messages] || e as string, 'red-darken-3', 2000);
	} finally {
		loading.value = false;
	}
});
</script>

<style lang="scss" scoped></style>