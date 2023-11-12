<template>
	<v-layout class="app">
		<AppNavbar @drawer="drawer = !drawer" :title="navbarTitle" @logout="logout" />

		<AppSidebar v-model="drawer" />

		<v-main style="min-height: 100dvh; min-height: 100vh" class="overflow-hidden">
			<router-view @updateTitle="(title: string) => (navbarTitle = title)" />
		</v-main>
	</v-layout>
</template>

<script setup lang="ts">
import AppNavbar from '@/components/app/AppNavbar.vue';
import AppSidebar from '@/components/app/AppSidebar.vue';
import messages from '@/utils/messages.json';
import { ref, onBeforeUnmount, provide, watchEffect } from 'vue';
import { UserService } from '@/services/user';
import { useAsyncState } from '@vueuse/core';
import { globalLoadingKey } from '@/injection-keys';
import { useUserStore } from '@/stores/user';
import { useRoute, useRouter, definePage } from 'vue-router/auto';
import { useSnackbarStore } from '@/stores/snackbar';
import { AuthService } from '@/services/auth';

definePage({ meta: { auth: true, requiresAuth: true } });
const drawer = ref(true);
const navbarTitle = ref<string>('');

// Fetching all auth userdata
const { push } = useRouter();
const route = useRoute();
const { showMessage } = useSnackbarStore();
const { $reset } = useUserStore();

watchEffect(() => {
	if (route.name !== '/chat/[chatId]') {
		navbarTitle.value = 'My chat';
	}
});

const { state: unsub, isLoading } = useAsyncState(UserService.fetchAuthUser, null, {
	onError: e => {
		console.error(e);
		showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
	},
});

provide(globalLoadingKey, isLoading);

const logout = async () => {
	try {
		await AuthService.logout();
		push('/login');
	} catch (e) {
		showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
	}
};

// Unsubscribe from receiving userdata realtime firebase and reseting store
onBeforeUnmount(() => {
	unsub.value?.();
	$reset();
});
</script>
