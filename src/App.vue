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

<style lang="scss">
.v-divider {
  --v-border-opacity: 0.6 !important;
}
/* width */
::-webkit-scrollbar {
  width: 0.55rem;
}

/* Track */
::-webkit-scrollbar-track {
  border-radius: 0.5rem;
}

/* Handle */
::-webkit-scrollbar-thumb {
  // visibility: v-bind('scrollVisibility');
  background-color: rgba($color: #ffffff, $alpha: .2);
  border-radius: 0.5rem;
  transition: all 0.35s ease-in 0s;
  &:hover {
    background-color: rgba($color: #ffffff, $alpha: .4);
  }
}
</style>
