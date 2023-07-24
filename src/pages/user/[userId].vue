<template>
	<div v-if="!userdata || !Object.keys(userdata).length" class="text-h5 pa-4 mt-5">Пользователь не найден</div>
	<div v-else>
		<v-card class="pa-5">
			<v-card-title>
				<v-row align="center" justify="space-between">
					<v-col cols="10" class="d-flex align-center">
						<v-img :lazy-src="defaultAvatar" :src="(userdata?.info?.photoURL)?.toString()" alt="Фото"
							max-width="100px" class="mr-5" eager />
						<div class="">
							<h2 class="mb-2">{{ userdata?.info?.displayName }}</h2>
							<div class="d-flex align-center mt-2">
								<span class="text-subtitle-1 mr-2">Пол:</span>
								<small>
									<v-icon
										:icon="userdata?.info?.gender === 'unknown' ? mdiHelp : userdata?.info?.gender === 'male' ? mdiGenderMale : mdiGenderFemale" />
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
								<v-btn v-bind="props" size="x-large" variant="text" :icon="mdiAccountPlusOutline" class="ml-2"
									@click="addToFriend" />
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
import messages from '@/utils/messages.json';
import { computed, toRef } from 'vue';
import { getUserdataById, addToFriend as addFriend } from '@/services/userdata';
import { useRoute, useRouter } from 'vue-router';
import { getUid } from '@/services/auth';
import { joinPrivateChat } from '@/services/chat';
import { useMeta } from 'vue-meta';
import { useSnackbarStore } from '@/stores/snackbar';
import { defaultAvatar } from '@/utils/globals';

const { showMessage } = useSnackbarStore();
const route = useRoute();
const { push } = useRouter();

const userId = toRef(route.params.userId as string);
const userdata = await getUserdataById(userId.value);
const uid = await getUid();

//Dynamic page title
useMeta(computed(() => {
	if (userdata && Object.keys(userdata).length) {
		return { title: `${userdata?.info?.displayName}` }
	}
	return { title: 'Профиль' }
}));

const goToChat = async () => {
	try {
		const chatId = await joinPrivateChat(userId.value);
		push({ name: 'chat-chatId', params: { chatId } });
	} catch (e) {
		showMessage(messages[e as keyof typeof messages] || e as string, 'red-darken-3', 2000);
	}
};
const addToFriend = async () => {
	if (userId.value) {
		await addFriend(userId.value);
	}
}
</script>
