<template>
  <metainfo>
    <template v-slot:title="{ content }">{{ content ? `${content} | ${AppName}` : AppName }}</template>
  </metainfo>
  <GlobalSnackbar />
  <Suspense>
    <template #default>
      <RouterView />
    </template>
    <template #fallback>
      <page-loader />
    </template>
  </Suspense>
</template>

<script setup>
import GlobalSnackbar from '@/components/app/GlobalSnackbar.vue';
import pageLoader from '@/components/UI/pageLoader.vue';
import { onErrorCaptured } from 'vue';

const AppName = import.meta.env.VITE_APP_NAME || 'My Chat';
onErrorCaptured((err, instance, info) => {
  console.error(err, info);
});
</script>

<style lang="scss"></style>
