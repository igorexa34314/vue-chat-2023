<template>
	<v-container class="d-flex flex-column align-center justify-center" style="min-height: 100vh">
		<LoginForm />
	</v-container>
</template>

<script setup lang="ts">
import LoginForm from '@/components/auth/LoginForm.vue';
import { useMeta } from 'vue-meta';

useMeta({ title: 'Вход' });
</script>

<route lang="yaml">
meta:
  layout: empty
</route>