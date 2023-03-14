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
import { ref, computed, provide, onUnmounted } from 'vue';
import { useUserdataStore } from '@/stores/userdata';
import { userDataKey } from '@/injection-keys';
import type { UserData } from '@/types/db/UserdataTable';

const userdataStore = useUserdataStore();
const drawer = ref(true);

const unsubscribe = await userdataStore.fetchAuthUserdata();

// Unsubscribe from receiving userdata realtime firebase
onUnmounted(() => unsubscribe?.());

const userdata = computed(() => userdataStore.userdata as UserData);

provide(userDataKey, userdata);
</script>

<style lang="scss" scoped></style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>