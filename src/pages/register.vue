<template>
	<v-container class="d-flex flex-column align-center justify-center" style="min-height: 100dvh; min-height: 100vh">
		<RegisterForm />
	</v-container>
</template>

<script setup lang="ts">
import RegisterForm from '@/components/auth/RegisterForm.vue';
import { useMeta } from 'vue-meta'

useMeta({ title: 'Register' });
</script>

<route lang="yaml">
meta:
  layout: empty
</route>