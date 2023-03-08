<template>
	<v-navigation-drawer v-model="drawer" width="320" location="left" class="pa-3">
		<!-- <div v-if="!userdata || !Object.keys(userdata.info).length || !userChatsInfo || !userChatsInfo.length">
			<page-loader />
		</div> -->
		<v-card v-if="userdata.info && Object.keys(userdata.info).length" class="py-1 bg-blue-grey-darken-4"
			density="compact" variant="text" to="/profile">
			<template v-slot:prepend>
				<v-avatar :image="userdata.info.photoURL || defaultAvatar" />
			</template>
			<template v-slot:title>{{ userdata.info.displayName || 'Unknown' }}</template>
		</v-card>
		<v-divider thickness="2" class="mt-2" />
		<v-list v-if="userChatsInfo && userChatsInfo.length && !loading" density="comfortable" class="mt-3">
			<v-list-item v-for="chat in userChatsInfo" :key="chat.id"
				:title="chat.type === 'private' ? chat.opponent.displayName : chat.name" class="py-3 mb-3"
				:prepend-avatar="chat.type === 'private' ? chat.opponent.photoURL : chat.type === 'self' ? savedMessages : defaultAvatar"
				:to="{ name: 'chat-id', params: { id: chat.id } }" />
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

const { getChatInfoById } = useChat();
const userdata = inject('userdata');
const userChats = inject('userChats');
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

const fetchChatsInfo = async () => {
	if (userChats.value && userChats.value.length) {
		loading.value = true;
		const info = await Promise.all(userChats.value.map(getChatInfoById));
		loading.value = false;
		return info;
	}
	loading.value = false;
};
const userChatsInfo = computedAsync(async () => await fetchChatsInfo());
</script>

<style lang="scss" scoped></style>