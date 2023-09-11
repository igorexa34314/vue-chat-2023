<template>
	<v-layout class="app">
		<AppNavbar @drawer="drawer = !drawer" />

		<AppSidebar v-model="drawer" />

		<v-main style="min-height: 100dvh; min-height: 100vh" class="overflow-hidden">
			<RouterView />
		</v-main>
	</v-layout>
</template>

<script setup lang="ts">
import { VLayout, VMain } from 'vuetify/components';
import AppNavbar from '@/components/app/AppNavbar.vue';
import AppSidebar from '@/components/app/AppSidebar.vue';
import { ref, onUnmounted, provide } from 'vue';
import { UserService } from '@/services/user';
import { useAsyncState } from '@vueuse/core';
import { globalLoadingKey } from '@/injection-keys';
import { useUserdataStore } from '@/stores/userdata';
import { definePage } from 'vue-router/auto';

definePage({ meta: { auth: true, requiresAuth: true } });
const drawer = ref(true);

// Fetching all auth userdata
const { state: unsub, isLoading } = useAsyncState(UserService.fetchAuthUser, null, {});
const { $reset } = useUserdataStore();

provide(globalLoadingKey, isLoading);

// Unsubscribe from receiving userdata realtime firebase and reseting store
onUnmounted(() => {
	unsub.value?.();
	$reset();
});
</script>
