<template>
	<v-layout class="app">
		<AppNavbar @drawer="drawer = !drawer" />

		<AppSidebar v-model="drawer" />

		<v-main style="min-height: 100vh;">
			<RouterView />
		</v-main>
	</v-layout>
</template>

<script setup lang="ts">
import AppNavbar from '@/components/app/AppNavbar.vue';
import AppSidebar from '@/components/app/AppSidebar.vue';
import { ref, onUnmounted } from 'vue';
import { fetchAuthUserdata } from '@/services/userdata';

const drawer = ref(true);

// Fetching all auth userdata
const unsubscribe = await fetchAuthUserdata();

// Unsubscribe from receiving userdata realtime firebase
onUnmounted(() => unsubscribe?.());
</script>

<style lang="scss" scoped></style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>