<template>
  <metainfo>
    <template #title="{ content }">{{ content ? `${content} | ${AppName}` : AppName }}</template>
  </metainfo>
  <GlobalSnackbar />
  <RouterView #default="{ Component }">
    <template v-if="Component">
      <Suspense>
        <!-- main content -->
        <component :is="Component"></component>
        <!-- loading state -->
        <template #fallback>
          <page-loader />
        </template>
      </Suspense>
    </template>
  </RouterView>
</template>

<script setup lang="ts">
import GlobalSnackbar from '@/components/app/GlobalSnackbar.vue';

const AppName = import.meta.env.VITE_APP_NAME || 'My Chat';
</script>

<style lang="scss">
@import "@/assets/styles/scroll";

.v-divider {
  --v-border-opacity: 0.6 !important;
}

.no-background-hover:hover {
  background-color: transparent !important;
}
</style>
