<template>
  <metainfo>
    <template v-slot:title="{ content }">{{ content ? `${content} | ${AppName}` : AppName }}</template>
  </metainfo>
  <GlobalSnackbar />
  <suspense>
    <template #default>
      <RouterView />
    </template>
    <template #fallback>
      <page-loader />
    </template>
  </suspense>
</template>

<script setup>
import GlobalSnackbar from '@/components/app/GlobalSnackbar.vue';
import pageLoader from '@/components/UI/pageLoader.vue';

const AppName = import.meta.env.VITE_APP_NAME || 'My Chat';
</script>

<style lang="scss"></style>
