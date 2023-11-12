<template>
	<div class="d-flex align-center justify-center fill-height">
		<v-progress-circular
			:model-value="modelValue"
			:color="color"
			:size="size || (smAndUp ? 50 : 36)"
			:width="width || (smAndUp ? 4 : 3)"
			indeterminate
			:bg-color="bgColor"
			class="rounded-circle"
			@click.capture="emit('cancel')">
			<v-icon :icon="mdiClose" :size="iconSize || (smAndUp ? 26 : 20)" />
		</v-progress-circular>
	</div>
</template>

<script setup lang="ts">
import { mdiClose } from '@mdi/js';
import { useDisplay } from 'vuetify';

const { color = 'grey-lighten-4', bgColor = 'grey-darken-4' } = defineProps<{
	color?: string;
	bgColor?: string;
	size?: string | number;
	width?: string | number;
	iconSize?: string | number;
}>();

const emit = defineEmits<{
	cancel: [];
}>();

const modelValue = defineModel<string | number>('modelValue');

const { smAndUp } = useDisplay();
</script>
