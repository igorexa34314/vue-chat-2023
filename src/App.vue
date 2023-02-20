<template>
  <metainfo>
    <template v-slot:title="{ content }">{{ content ? `${content} | ${AppName}` : AppName }}</template>
  </metainfo>
  <GlobalSnackbar />
  <suspense>
    <RouterView />
  </suspense>
</template>

<script setup>
import GlobalSnackbar from '@/components/app/GlobalSnackbar.vue';

const AppName = import.meta.env.VITE_APP_NAME || 'My Chat';
</script>

<style lang="scss"></style>
