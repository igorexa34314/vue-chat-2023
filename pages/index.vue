<template>
	<v-container class="d-flex flex-column align-center justify-center" style="min-height: 100vh">
		<login-form />
	</v-container>
</template>

<script setup>
definePageMeta({ layout: 'empty' })
const socket = ref();
</script>

<style lang="scss" scoped>

</style>