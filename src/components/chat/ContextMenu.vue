<template>
	<v-menu v-model="showMenu" :activator="activator" transition="scale-transition" contained>
		<template #activator="{ props, isActive }">
			<slot name="activator" v-bind="{ props, isActive }"></slot>
		</template>
		<v-list max-width="400">
			<v-list-item v-for="item of contextMenuItems" :key="item.value" :title="item.title" />
		</v-list>
	</v-menu>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import type { VMenu } from 'vuetify/components';

const props = withDefaults(defineProps<{
	modelValue?: boolean;
	activator?: VMenu['activator'];
}>(), {
	modelValue: false,
});
const emit = defineEmits<{
	(e: 'update:modelValue', val: boolean): void
}>();
const showMenu = useVModel(props, 'modelValue', emit);
const contextMenuItems = [
	{ title: 'Переслать', value: 'forward', icon: '' },
	{ title: 'Переслать', value: 'forward', icon: '' },
	{ title: 'Переслать', value: 'forward', icon: '' },
	{ title: 'Переслать', value: 'forward', icon: '' },
];
</script>

<style scoped></style>