<template></template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const { push } = useRouter();
push('/profile');
</script>

<style lang="scss" scoped></style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>