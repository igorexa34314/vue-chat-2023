<template>
	<v-layout class="app">
		<AppNavbar @drawer="drawer = !drawer" />

		<AppSidebar v-model="drawer" />

		<v-main style="min-height: 100vh;">
			<RouterView />
		</v-main>
	</v-layout>
</template>

<script setup>
import AppNavbar from '@/components/app/AppNavbar.vue';
import AppSidebar from '@/components/app/AppSidebar.vue';
import { ref, computed, provide, onUnmounted } from 'vue';
import { useUserdataStore } from '@/stores/userdata';

const userdataStore = useUserdataStore();
const drawer = ref(true);

const unsubscribe = await userdataStore.fetchAuthUserdata();

onUnmounted(() => {
	if (unsubscribe) unsubscribe();
});

const userdata = computed(() => userdataStore.userdata);
const userChats = computed(() => userdata.value.chats);
provide('userdata', userdata);
provide('userChats', userChats);
</script>

<style lang="scss" scoped></style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>