<template>
	<v-menu v-model="showMenu" ref="ctxMenu" :attach="attach" :persistent="true" transition="scale-transition">
		<template #activator="{ props, isActive }">
			<slot name="activator" :props="props" :isActive="isActive"></slot>
		</template>
		<v-list>
			<v-list-item v-for="item of contextMenuItems" :key="item.value" :title="item.title" />
		</v-list>
	</v-menu>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core';

const props = withDefaults(defineProps<{
	modelValue?: boolean;
	attach?: string | boolean | Element;
}>(), { modelValue: false });

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