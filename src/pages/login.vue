<template>
	<v-container class="d-flex flex-column align-center justify-center" style="min-height: 100dvh; min-height: 100vh">
		<LoginForm />
	</v-container>
</template>

<script setup lang="ts">
import { VContainer } from 'vuetify/components';
import LoginForm from '@/components/auth/LoginForm.vue';
import { useMeta } from 'vue-meta';
import { definePage } from 'vue-router/auto';

definePage({ meta: { layout: 'empty' } });
useMeta({ title: 'Login' });
</script>
