<template>
	<div v-if="userdata">
		<v-card class="pa-5">
			<v-card-title>
				<v-row align="center" justify="space-between">
					<v-col cols="10" class="d-flex align-center">
						<v-img :lazy-src="defaultAvatar" :src="userdata.info.photoURL" alt="Фото" max-width="100px"
							class="mr-5" />
						<div class="">
							<h2 class="mb-2">{{ userdata.info.displayName }}</h2>
							<small><v-icon
									:icon="userdata.info.gender === 'unknown' ? 'mdi-help' : userdata.info.gender === 'male' ? 'mdi-gender-male' : 'mdi-gender-female'"></v-icon>
							</small>
						</div>
					</v-col>
					<v-col class="" v-if="route.params.id !== uid">
						<v-tooltip location="bottom">
							<template v-slot:activator="{ props }">
								<v-btn v-bind="props" size="x-large" variant="text" icon="mdi-message-text" @click="goToChat" />
							</template>
							<span class="text-subtitle-2 font-weight-medium">Перейти в сообщения</span>
						</v-tooltip>
						<v-tooltip location="bottom">
							<template v-slot:activator="{ props }">
								<v-btn v-bind="props" size="x-large" variant="text" icon="mdi-account-plus-outline" class="ml-2"
									@click="addToFriend" />
							</template>
							<span class="text-subtitle-2 font-weight-medium">Добавить в друзья</span>
						</v-tooltip>
					</v-col>
				</v-row>

			</v-card-title>
			<v-card-text></v-card-text>
			<v-card-actions></v-card-actions>
		</v-card>
	</div>
	<div v-else>Пользователь не найден</div>
</template>

<script setup>
import { useUserdataStore } from '@/stores/userdata';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@/composables/auth';
import { useChat } from '@/composables/chat';

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;

const { getUid } = useAuth();
const { joinPrivateChat } = useChat();
const route = useRoute();
const { push } = useRouter();
const userdataStore = useUserdataStore();

const userdata = ref();
const uid = ref('');

onMounted(async () => {
	userdata.value = await userdataStore.getUserdataById(route.params.id);
	uid.value = await getUid();
});

const goToChat = async () => {
	try {
		const chatId = await joinPrivateChat(route.params.id);
		push({ name: 'chat-id', params: { id: chatId } });
	} catch (e) {
		console.error(e);
	}
};
const addToFriend = async () => {
	if (route.params.id) {
		await userdataStore.addToFriend(route.params.id);
	}
}
</script>

<style lang="scss" scoped></style>