<template>
	<div v-if="!userdata || !Object.keys(userdata).length" class="text-h5 pa-4 mt-5">Пользователь не найден</div>
	<div v-else>
		<v-card class="pa-5">
			<v-card-title>
				<v-row align="center" justify="space-between">
					<v-col cols="10" class="d-flex align-center">
						<v-img
							:lazy-src="defaultAvatar"
							:src="userdata?.info?.photoURL?.toString()"
							alt="Фото"
							:max-width="xs ? '80px' : '100px'"
							class="mr-5"
							eager
							:width="xs ? 'auto' : '100%'" />
						<div class="">
							<h2 class="mb-2">{{ userdata?.info?.displayName }}</h2>
							<div class="d-flex align-center mt-2">
								<span class="text-subtitle-1 mr-2">Пол:</span>
								<small>
									<v-icon
										:icon="
											userdata?.info?.gender === 'unknown'
												? mdiHelp
												: userdata?.info?.gender === 'male'
												? mdiGenderMale
												: mdiGenderFemale
										" />
								</small>
							</div>
						</div>
					</v-col>
					<v-col v-if="userId !== uid">
						<v-tooltip location="bottom">
							<template #activator="{ props }">
								<v-btn v-bind="props" size="x-large" variant="text" :icon="mdiMessageText" @click="goToChat" />
							</template>
							<span class="text-subtitle-2 font-weight-medium">Перейти в сообщения</span>
						</v-tooltip>
						<v-tooltip location="bottom">
							<template #activator="{ props }">
								<v-btn
									v-bind="props"
									size="x-large"
									variant="text"
									:icon="mdiAccountPlusOutline"
									class="ml-2"
									@click="addToFriend"
									disabled />
							</template>
							<span class="text-subtitle-2 font-weight-medium">Добавить в друзья</span>
						</v-tooltip>
					</v-col>
				</v-row>
			</v-card-title>
		</v-card>
	</div>
</template>

<script setup lang="ts">
import { mdiHelp, mdiGenderMale, mdiGenderFemale, mdiMessageText, mdiAccountPlusOutline } from '@mdi/js';
import { VTooltip } from 'vuetify/components';
import messages from '@/utils/messages.json';
import { computed, toRef, ref, watchEffect } from 'vue';
import { getUserdataById, addToFriend as addFriend } from '@/services/user';
import { useRoute, useRouter } from 'vue-router/auto';
import { getUid } from '@/services/auth';
import { joinPrivateChat } from '@/services/chat';
import { useMeta } from 'vue-meta';
import { useSnackbarStore } from '@/stores/snackbar';
import { defaultAvatar } from '@/globals';
import { UserData } from '@/types/db/UserdataTable';
import { useDisplay } from 'vuetify';

const { xs } = useDisplay();
const { showMessage } = useSnackbarStore();
const route = useRoute('/user/[userId]');
const { push } = useRouter();

const userdata = ref<UserData>();
const userId = toRef(() => route.params.userId);
watchEffect(async () => {
	if (userId.value) {
		userdata.value = await getUserdataById(userId.value);
	}
});
const uid = await getUid();

//Dynamic page title
useMeta(
	computed(() => {
		if (userdata && Object.keys(userdata).length) {
			return { title: `${userdata.value?.info.displayName}` || 'User' };
		}
		return { title: 'User' };
	})
);

const goToChat = async () => {
	try {
		if (userId.value) {
			const chatId = await joinPrivateChat(userId.value);
			if (chatId) {
				push({ name: '/chat/[chatId]', params: { chatId } });
			}
		}
	} catch (e) {
		showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
	}
};
const addToFriend = async () => {
	if (userId.value) {
		await addFriend(userId.value);
	}
};
</script>
