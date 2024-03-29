<template>
	<section class="mt-1 mt-sm-5 pa-3 pa-sm-5">
		<h2 class="ml-4 mt-2">Profile</h2>

		<v-tabs v-model="pickedProfileTab" class="mt-5 ml-3" density="comfortable">
			<v-tab v-for="tab in profileTabs" :key="tab.value" :value="tab.value" :disabled="tab.disabled">
				{{ tab.title }}
			</v-tab>
		</v-tabs>

		<v-window v-model="pickedProfileTab">
			<v-window-item :value="profileTabs[0].value" style="min-height: 100px">
				<v-container fluid class="pa-2 pa-sm-4">
					<div v-if="loading"><page-loader /></div>
					<InfoForm v-if="info && Object.keys(info).length" :uinfo="info" @submit="submitForm" />
				</v-container>
			</v-window-item>
		</v-window>
	</section>
</template>

<script setup lang="ts">
import InfoForm, { type IProfileForm } from '@/components/profile/InfoForm.vue';
import messages from '@/utils/messages.json';
import { UserService } from '@/services/user';
import { useUserStore } from '@/stores/user';
import { ref, inject, computed } from 'vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { useMeta } from 'vue-meta';
import { globalLoadingKey } from '@/injection-keys';
import { definePage } from 'vue-router/auto';

definePage({ alias: '/' });
useMeta({ title: 'My profile' });

const usersStore = useUserStore();
const info = computed(() => usersStore.info);
const { showMessage } = useSnackbarStore();
const loading = inject(globalLoadingKey);
const profileTabs = [
	{ title: 'Info', value: 'info' },
	{ title: 'Security', value: 'security', disabled: true },
	{ title: 'Notifications', value: 'notifications', disabled: true },
];
const pickedProfileTab = ref(profileTabs[0].value);

const submitForm = async ({ avatar, ...formData }: IProfileForm) => {
	try {
		if (avatar?.length) {
			await UserService.updateUserInfo({ ...formData, photoURL: await UserService.uploadUserAvatar(avatar[0]) });
		} else {
			await UserService.updateUserInfo(formData);
		}
		showMessage('succesfully_updated');
	} catch (e) {
		console.error(e);
		showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
	}
};
</script>
