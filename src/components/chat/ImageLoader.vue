<template>
	<div class="d-flex align-center justify-center fill-height">
		<v-progress-circular :model-value="modelValue" :color="color" :size="45" :width="5" indeterminate />
	</div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	modelValue?: string | number;
	color?: string;
}>(), {
	color: 'grey-lighten-4'
});
</script>

<style scoped></style>