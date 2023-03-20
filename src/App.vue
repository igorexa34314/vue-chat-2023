<template>
  <metainfo>
    <template #title="{ content }">{{ content ? `${content} | ${AppName}` : AppName }}</template>
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

<script setup lang="ts">
import GlobalSnackbar from '@/components/app/GlobalSnackbar.vue';
import { onErrorCaptured } from 'vue';

const AppName = import.meta.env.VITE_APP_NAME || 'My Chat';

// onErrorCaptured((err, instance, info) => {
//   console.error(err, instance, info);
// });
</script>

<style lang="scss">
.v-divider {
  --v-border-opacity: 0.6 !important;
}

.no-background-hover:hover {
  background-color: transparent !important;
}
</style>
