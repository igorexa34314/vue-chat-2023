<template>
	<div class="d-flex align-center justify-center fill-height">
		<v-progress-circular :model-value="modelValue" :color="color" :size="size" :width="width" indeterminate
			bg-color="grey-darken-4" class="image-loader" @click.capture="emit('cancel')">
			<v-icon icon="mdi-close" :size="iconSize" />
		</v-progress-circular>
	</div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	modelValue?: string | number;
	color?: string;
	size?: string | number;
	width?: string | number;
	iconSize?: string | number;
}>(), {
	color: 'grey-lighten-4',
	size: 50,
	width: 4,
	iconSize: 26
});
const emit = defineEmits<{
	(e: 'cancel'): void
}>();
</script>

<style scoped>
.image-loader {
	border-radius: 50%;
	background-color: rgba(0, 0, 0, 0.7);
}
</style>