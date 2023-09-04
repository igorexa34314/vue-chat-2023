<template>
	<v-container class="d-flex flex-column align-center justify-center" style="min-height: 100dvh; min-height: 100vh">
		<RegisterForm />
	</v-container>
</template>

<script setup lang="ts">
import RegisterForm from '@/components/auth/RegisterForm.vue';
import { VContainer } from 'vuetify/components';
import { useMeta } from 'vue-meta';
import { definePage } from 'vue-router/auto';

definePage({ meta: { layout: 'empty' } });
useMeta({ title: 'Register' });
</script>
