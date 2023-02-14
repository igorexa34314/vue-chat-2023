<template>
  <metainfo>
    <template v-slot:title="{ content }">{{ content? `${content} | ${AppName}` : AppName }}</template>
  </metainfo>
  <RouterView />
</template>

<script setup>
const AppName = import.meta.env.VITE_APP_NAME || 'My Chat';
</script>

<style lang="scss">

</style>
