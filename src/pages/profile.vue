<template>
	<section class="mt-5 pa-5">
		<h2 class="ml-4 mt-2">Ваш профиль</h2>

		<v-tabs v-model="pickedProfileTab" class="mt-5 ml-3" density="comfortable">
			<v-tab v-for="tab in profileTabs" :key="tab.value" :value="tab.value">
				{{ tab.title }}
			</v-tab>
		</v-tabs>

		<v-window v-model="pickedProfileTab">
			<v-window-item :value="profileTabs[0].value" style="min-height: 100px;">
				<v-container fluid>
					<div v-if="loading"><page-loader /></div>
					<InfoForm v-if="userInfo && Object.keys(userInfo).length" :uinfo="userInfo" @submit="submitForm" />
				</v-container>
			</v-window-item>
		</v-window>
	</section>
</template>

<script setup lang="ts">
import InfoForm from '@/components/profile/InfoForm.vue';
import messages from '@/utils/messages.json';
import { storeToRefs } from 'pinia';
import { updateUserdata, updateUserAvatar } from '@/services/userdata';
import { useUserdataStore } from '@/stores/userdata';
import { ref, inject } from 'vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { useMeta } from 'vue-meta';
import { globalLoadingKey } from '@/injection-keys';
import type { ProfileForm } from '@/components/profile/InfoForm.vue';

useMeta({ title: 'Мой профиль' });

const { getUInfo: userInfo } = storeToRefs(useUserdataStore());
const { showMessage } = useSnackbarStore();
const loading = inject(globalLoadingKey);
const profileTabs = [
	{ title: 'Информация', value: 'info' },
	{ title: 'Безопасность', value: 'security' },
	{ title: 'Уведомления', value: 'notifications' },
];
const pickedProfileTab = ref(profileTabs[0].value);

const submitForm = async ({ avatar, ...formData }: ProfileForm) => {
	try {
		await updateUserdata(formData);
		if (avatar?.length) {
			await updateUserAvatar(avatar[0]);
		}
		showMessage('succesfully_updated');
	} catch (e) {
		console.error(e);
		showMessage(messages[e as keyof typeof messages] || e as string, 'red-darken-3', 2000);
	}
};
</script>

<style lang="scss" scoped>

[v-cloak] {
	display: none;
}
</style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>