<template>
	<section class="mt-5 pa-5">
		<h2 class="ml-4 mt-2">Ваш профиль</h2>

		<v-tabs v-model="pickedProfileTab" class="mt-5 ml-3" density="comfortable">
			<v-tab v-for="tab in profileTabs" :key="tab.value" :value="tab.value">
				{{ tab.title }}
			</v-tab>
		</v-tabs>

		<v-window v-model="pickedProfileTab">
			<v-window-item :value="profileTabs[0].value">
				<v-container fluid>
					<InfoForm v-if="userdata?.info" :uinfo="userdata.info" @submit="submitForm" />
					<div v-else><page-loader /></div>
				</v-container>
			</v-window-item>
		</v-window>
	</section>
</template>

<script setup lang="ts">
import InfoForm from '@/components/profile/InfoForm.vue';
import pageLoader from '@/components/UI/pageLoader.vue';
import { useUserdataStore } from '@/stores/userdata';
import { ref, inject } from 'vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { useMeta } from 'vue-meta';
import { userDataKey } from '@/injection-keys';
import messages from '@/utils/messages.json';
import type { ProfileForm } from '@/components/profile/InfoForm.vue';

useMeta({ title: 'Мой профиль' });

const { updateUserdata, updateUserAvatar } = useUserdataStore();
const { showMessage } = useSnackbarStore();
const userdata = inject(userDataKey);

const profileTabs = [
	{ title: 'Информация', value: 'info' },
	{ title: 'Безопасность', value: 'security' },
	{ title: 'Уведомлениия', value: 'notifications' },
];

const pickedProfileTab = ref(profileTabs[0].value);

const submitForm = async ({ avatar, ...formData }: ProfileForm) => {
	try {
		if (avatar.length) {
			await updateUserAvatar(avatar[0]);
		}
		await updateUserdata(formData);
		showMessage('succesfully_updated');
	} catch (e: unknown) {
		console.error(e);
		showMessage(messages[e] || e, 'red-darken-3', 2000);
	}
};
</script>

<style lang="scss" scoped></style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>