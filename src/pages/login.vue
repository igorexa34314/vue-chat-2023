<template>
	<v-container class="d-flex flex-column align-center justify-center" style="min-height: 100vh">
		<LoginForm />
	</v-container>
</template>

<script setup>
import LoginForm from '@/components/LoginForm.vue';
import { useMeta } from 'vue-meta'

useMeta({ title: 'Главная' })
</script>

<style lang="scss" scoped>

</style>

<route lang="yaml">
meta:
  layout: empty
</route>