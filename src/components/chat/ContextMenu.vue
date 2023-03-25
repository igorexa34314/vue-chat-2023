<template>
	<v-menu v-model="showMenu" ref="ctxMenu" :activator="activator" transition="scale-transition" max-width="400">
		<template #activator="{ props, isActive }">
			<slot name="activator" v-bind="{ props, isActive }"></slot>
		</template>
		<v-list>
			<v-list-item v-for="item of contextMenuItems" :key="item.value" :title="item.title" />
		</v-list>
	</v-menu>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useVModel } from '@vueuse/core';
import type { VMenu } from 'vuetify/components';

const props = withDefaults(defineProps<{
	modelValue?: boolean;
	activator?: VMenu['activator'];
	position?: { x: number | string, y: number | string };
}>(), { modelValue: false });
// watch(() => props.position, () => {
// 	emit('update:modelValue', false);
// 	nextTick(() => {
// 		emit('update:modelValue', true);
// 	});
// });
const emit = defineEmits<{
	(e: 'update:modelValue', val: boolean): void
}>();
const ctxMenu = ref<VMenu>();
const click = ((e: Event) => {
	ctxMenu.value?.updateLocation?.(e);
});
const showMenu = useVModel(props, 'modelValue', emit);
const contextMenuItems = [
	{ title: 'Переслать', value: 'forward', icon: '' },
	{ title: 'Переслать', value: 'forward', icon: '' },
	{ title: 'Переслать', value: 'forward', icon: '' },
	{ title: 'Переслать', value: 'forward', icon: '' },
];
defineExpose({
	updateLocation: ctxMenu.value?.updateLocation
});
</script>

<style scoped></style>