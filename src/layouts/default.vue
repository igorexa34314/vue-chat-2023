<template>
	<v-layout class="app">
		<AppNavbar @drawer="drawer = !drawer" />

		<AppSidebar v-model="drawer" />

		<v-main style="min-height: 100vh; overflow: hidden;">
			<RouterView />
		</v-main>
	</v-layout>
</template>

<script setup lang="ts">
import AppNavbar from '@/components/app/AppNavbar.vue';
import AppSidebar from '@/components/app/AppSidebar.vue';
import { ref, onUnmounted, provide } from 'vue';
import { fetchAuthUserdata } from '@/services/userdata';
import { useAsyncState } from '@vueuse/core';
import { globalLoadingKey } from '@/injection-keys';

const drawer = ref(true);

// Fetching all auth userdata
const { state: unsub, isLoading } = useAsyncState(fetchAuthUserdata, undefined, {});

provide(globalLoadingKey, isLoading);

// Unsubscribe from receiving userdata realtime firebase
onUnmounted(() => unsub.value?.());
</script>

<style lang="scss" scoped></style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>