<template>
	<v-navigation-drawer v-model="drawer" width="320" location="left" class="app-sidebar pl-3 pr-0">
		<v-card
			v-if="userStore.info && Object.keys(userStore.info).length"
			class="user-info py-1 mt-3 bg-blue-grey-darken-4 pr-2"
			density="compact"
			variant="text"
			@click="push('/profile')"
			draggable="false">
			<template #prepend>
				<v-avatar>
					<v-img :src="userStore.info.photoURL || defaultAvatar" :lazy-src="defaultAvatar">
						<template #error><v-img :src="defaultAvatar" /></template
					></v-img>
				</v-avatar>
			</template>
			<template #title>{{ setUserDisplayName(userStore.info) }}</template>
		</v-card>

		<v-skeleton-loader v-else type="list-item-avatar" width="100%" color="navbar" max-width="240px" />

		<v-divider thickness="2" class="mt-2" />

		<div v-if="userStore.isChatsLoading">
			<page-loader />
		</div>

		<ChatList v-else-if="userStore.chats.length" :chats="userStore.chats.map(chat => chat.info)" />

		<div v-else class="mt-4 pa-3">
			<p class="text-h6 text-center">No chats</p>
		</div>
	</v-navigation-drawer>
</template>

<script lang="ts" setup>
import ChatList from '@/components/chat/ChatList.vue';
import { VSkeletonLoader } from 'vuetify/labs/VSkeletonLoader';
import { VNavigationDrawer } from 'vuetify/components';
import { useVModel } from '@vueuse/core';
import { useUserStore } from '@/stores/user';
import { defaultAvatar } from '@/global-vars';
import { useRouter } from 'vue-router/auto';
import { setUserDisplayName } from '@/utils/user';

const { push } = useRouter();
const userStore = useUserStore();

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
