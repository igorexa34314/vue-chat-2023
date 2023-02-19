<template>
	<v-layout class="app">
		<AppNavbar @drawer="drawer = !drawer" />

		<AppSidebar v-model="drawer" />

		<v-main>
			<RouterView />
		</v-main>
	</v-layout>
</template>

<script setup>
import AppNavbar from '@/components/app/AppNavbar.vue';
import AppSidebar from '@/components/app/AppSidebar.vue';
import { ref, computed, onMounted } from 'vue';
import { useUserdataStore } from '@/stores/userdata';

const userdataStore = useUserdataStore();

onMounted(async () => {
	await userdataStore.fetchAuthUserdata();
});

const user = computed(() => userdataStore.userdata);

const drawer = ref(true);
</script>

<style lang="scss" scoped></style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>