<template>
	<v-container class="d-flex flex-column align-center justify-center" style="min-height: 100vh">
		<RegisterForm />
	</v-container>
</template>

<script setup>
import RegisterForm from '@/components/RegisterForm.vue';
import { useMeta } from 'vue-meta'

useMeta({ title: 'Главная' })
</script>

<style lang="scss" scoped>

</style>

<route lang="yaml">
meta:
  layout: empty
</route>