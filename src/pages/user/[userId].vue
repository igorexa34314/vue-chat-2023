<template>
	<div v-if="!isLoading && (!userInfo || !Object.keys(userInfo).length)" class="text-h5 pa-4 mt-5">User not found</div>
	<div v-else>
		<v-card class="pa-5">
			<v-card-title>
				<v-row align="center" justify="space-between">
					<v-col cols="10" class="d-flex align-center">
						<v-img
							:lazy-src="defaultAvatar"
							:src="userInfo?.photoURL || defaultAvatar"
							alt="Фото"
							:max-width="xs ? '80px' : '100px'"
							class="mr-5"
							eager
							:width="xs ? 'auto' : '100%'" />
						<v-skeleton-loader v-if="isLoading" type="list-item" max-width="480" min-height="80" />
						<div v-else-if="userInfo" class="">
							<h2 class="mb-2">{{ setUserDisplayName(userInfo) }}</h2>
							<div class="d-flex align-center mt-2">
								<span class="text-subtitle-1 mr-2">Пол:</span>
								<small>
									<v-icon
										:icon="
											userInfo?.gender === 'unknown'
												? mdiHelp
												: userInfo?.gender === 'male'
												? mdiGenderMale
												: mdiGenderFemale
										" />
								</small>
							</div>
						</div>
					</v-col>
					<v-col v-if="userId !== userStore.info?.uid">
						<v-tooltip location="bottom">
							<template #activator="{ props }">
								<v-btn v-bind="props" size="x-large" variant="text" :icon="mdiMessageText" @click="goToChat" />
							</template>
							<span class="text-subtitle-2 font-weight-medium">Send message</span>
						</v-tooltip>
						<v-tooltip location="bottom">
							<template #activator="{ props }">
								<v-btn
									v-bind="props"
									size="x-large"
									variant="text"
									:icon="mdiAccountPlusOutline"
									class="ml-2"
									@click="addToFriend" />
							</template>
							<span class="text-subtitle-2 font-weight-medium">Add to friend</span>
						</v-tooltip>
					</v-col>
				</v-row>
			</v-card-title>
		</v-card>
	</div>
</template>

<script setup lang="ts">
import { mdiHelp, mdiGenderMale, mdiGenderFemale, mdiMessageText, mdiAccountPlusOutline } from '@mdi/js';
import messages from '@/utils/messages.json';
import { computed, toRef, watchEffect } from 'vue';
import { UserService } from '@/services/user';
import { useRoute, useRouter } from 'vue-router/auto';
import { ChatService } from '@/services/chat';
import { useMeta } from 'vue-meta';
import { useSnackbarStore } from '@/stores/snackbar';
import { defaultAvatar } from '@/global-vars';
import { useDisplay } from 'vuetify';
import { useAsyncState } from '@vueuse/core';
import { useUserStore } from '@/stores/user';
import { setUserDisplayName } from '@/utils/user';

const { xs } = useDisplay();
const { showMessage } = useSnackbarStore();
const route = useRoute('/user/[userId]');
const { push } = useRouter();
const userStore = useUserStore();

const {
	state: userInfo,
	isLoading,
	execute: fetchUserInfo,
} = useAsyncState(() => UserService.getUserInfoById(userId.value), null, {
	immediate: false,
});

const userId = toRef(() => route.params.userId);
watchEffect(async () => {
	if (userId.value) {
		await fetchUserInfo();
	}
});

//Dynamic page title
useMeta(
	computed(() => {
		if (userInfo.value && Object.keys(userInfo.value).length) {
			return { title: setUserDisplayName.value(userInfo.value) };
		}
		return { title: 'User' };
	})
);

const goToChat = async () => {
	try {
		if (userId.value) {
			const chatId = await ChatService.joinPrivateChat(userId.value);
			push({ name: '/chat/[chatId]', params: { chatId } });
		}
	} catch (e) {
		showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
	}
};
const addToFriend = async () => {
	if (userId.value) {
		await UserService.addToFriend(userId.value);
	}
};
</script>
