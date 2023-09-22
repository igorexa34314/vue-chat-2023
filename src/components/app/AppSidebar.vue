<template>
	<v-navigation-drawer v-model="drawer" width="320" location="left" class="app-sidebar pl-3 pr-0">
		<v-card
			v-if="userInfo && Object.keys(userInfo).length"
			class="user-info py-1 mt-3 bg-blue-grey-darken-4 pr-2"
			density="compact"
			variant="text"
			@click="push('/profile')"
			draggable="false">
			<template #prepend>
				<v-avatar :image="userInfo.photoURL || defaultAvatar" />
			</template>
			<template #title>{{ userInfo.displayName || 'Unknown' }}</template>
		</v-card>

		<v-skeleton-loader v-else type="list-item-avatar" width="100%" color="navbar" max-width="240px" />

		<v-divider thickness="2" class="mt-2" />

		<div v-if="isLoading">
			<page-loader />
		</div>

		<ChatList v-else-if="isReady && getUserChatsInfo.length" :chats="getUserChatsInfo" />

		<div v-else class="mt-4 pa-3">
			<p class="text-h6 text-center">No chats</p>
		</div>
	</v-navigation-drawer>
</template>

<script lang="ts" setup>
import ChatList from '@/components/chat/ChatList.vue';
import { VSkeletonLoader } from 'vuetify/labs/VSkeletonLoader';
import { VNavigationDrawer } from 'vuetify/components';
import messages from '@/utils/messages.json';
import { watch } from 'vue';
import { useAsyncState, useVModel } from '@vueuse/core';
import { ChatService } from '@/services/chat';
import { storeToRefs } from 'pinia';
import { useSnackbarStore } from '@/stores/snackbar';
import { useUserdataStore } from '@/stores/userdata';
import { defaultAvatar } from '@/global-vars';
import { useRouter } from 'vue-router/auto';

const { showMessage } = useSnackbarStore();
const { push } = useRouter();
const { getUserChats: userChats, getUserInfo: userInfo } = storeToRefs(useUserdataStore());

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
const {
	state: getUserChatsInfo,
	isLoading,
	isReady,
	execute: refreshChats,
} = useAsyncState(() => ChatService.getUserChatsInfo(...userChats.value), [], {
	immediate: false,
	onError: e => {
		console.error(e);
		showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
	},
});

watch(
	() => userChats.value.length,
	async newLength => {
		if (newLength) {
			await refreshChats();
		}
	},
	{
		immediate: true,
	}
);
</script>

<style lang="scss" scoped>
.user-info {
	:deep(img) {
		user-select: text;
		pointer-events: text;
	}
}

.app-sidebar {
	--v-scroll-width: 0.4rem;
	--v-scroll-bg: transparent;

	&:hover {
		--v-scroll-bg: rgba(255, 255, 255, 0.2);
	}
}
</style>
