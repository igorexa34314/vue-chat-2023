<template>
	<div class="birthday-picker">
		<v-select v-for="item in datePickerDateItems" :key="item.type" :label="item.title" :items="item.items"
			v-model="datePickerState[(item.type) as keyof typeof datePickerState]" :density="density" class="mr-4"
			:variant="variant" :class="`${item.type}-select`" :style="{ order: item.order }" />
	</div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import { monthsForLocale } from '@/utils/date';
import { VSelect } from 'vuetify/components';

const props = withDefaults(defineProps<{
	modelValue?: Date;
	fromYear?: string | number;
	order?: 'dd-mmm-yyyy' | 'mmm-dd-yyyy';
	density?: VSelect['$props']['density'];
	variant?: VSelect['$props']['variant'];
}>(), {
	modelValue: () => new Date(),
	fromYear: new Date().getFullYear() - 100,
	order: 'dd-mmm-yyyy',
	variant: 'outlined',
	density: 'compact'
});
const emit = defineEmits<{
	(e: 'update:modelValue', date: Date): void;
}>();

const datePickerDateItems = computed(() => ([
	{ type: 'month', title: 'Месяц', items: monthsForLocale('ru-RU', 'long').map((title, i) => ({ title, value: ++i })), order: props.order === 'dd-mmm-yyyy' ? 2 : 1 },
	{ type: 'day', title: 'День', items: Array.from({ length: 31 }, (v, i) => ++i), order: props.order === 'dd-mmm-yyyy' ? 1 : 2 },
	{ type: 'year', title: 'Год', items: Array.from({ length: new Date().getFullYear() - +props.fromYear }, (v, i) => (+props.fromYear - 1) + i).reverse(), order: 3 },
]));
const datePickerState = reactive({
	month: props.modelValue.getMonth() + 1,
	day: props.modelValue.getDate(),
	year: props.modelValue.getFullYear(),
});
watch(datePickerState, (newVal) => emit('update:modelValue', new Date(Object.values(newVal).join('-'))), { deep: true });
</script>

<style lang="scss" scoped>
.birthday-picker {
	display: flex;
	align-items: center;
}
</style>