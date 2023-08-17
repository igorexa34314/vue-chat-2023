<template>
	<div class="d-flex flex-column flex-sm-row align-sm-center" :style="{ 'max-width': `${maxWidth}px` }">
		<v-select
			v-for="item in datePickerDateItems"
			:key="item.type"
			:label="item.title"
			:items="item.items"
			v-model="datePickerState[item.type as keyof typeof datePickerState]"
			:density="density"
			class="mr-4"
			:variant="variant"
			:class="`${item.type}-select`"
			:style="{ order: item.order }" />
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { VSelect } from 'vuetify/components';
import { useI18n, DateTimeOptions } from 'vue-i18n';

const monthsForLocales = (monthFormat: DateTimeOptions['month'] = 'long') => {
	const { d } = useI18n({ inheritLocale: true, useScope: 'global' });
	return [...Array(12).keys()].map(m => d(new Date(Date.UTC(2022, ++m % 12)), { month: monthFormat }));
};

const props = withDefaults(
	defineProps<{
		modelValue?: Date;
		fromYear?: string | number;
		order?: 'dd-mmm-yyyy' | 'mmm-dd-yyyy';
		density?: VSelect['$props']['density'];
		variant?: VSelect['$props']['variant'];
		maxWidth?: string | number;
	}>(),
	{
		modelValue: () => new Date(),
		fromYear: new Date().getFullYear() - 100,
		order: 'dd-mmm-yyyy',
		variant: 'outlined',
		density: 'compact',
		maxWidth: 'none',
	}
);
const emit = defineEmits<{
	'update:modelValue': [date: Date];
}>();

const datePickerDateItems = computed(() => [
	{
		type: 'month',
		title: 'Month',
		items: monthsForLocales('long').map((title, i) => ({ title, value: ++i })),
		order: props.order === 'dd-mmm-yyyy' ? 2 : 1,
	},
	{
		type: 'day',
		title: 'Day',
		items: Array.from({ length: 31 }, (v, i) => ++i),
		order: props.order === 'dd-mmm-yyyy' ? 1 : 2,
	},
	{
		type: 'year',
		title: 'Year',
		items: Array.from(
			{ length: new Date().getFullYear() - +props.fromYear },
			(v, i) => +props.fromYear - 1 + i
		).reverse(),
		order: 3,
	},
]);

const datePickerState = ref({
	month: props.modelValue.getMonth() + 1,
	day: props.modelValue.getDate(),
	year: props.modelValue.getFullYear(),
});

watch(
	datePickerState,
	newVal => {
		emit('update:modelValue', new Date(Object.values(newVal).join('-')));
	},
	{ deep: true }
);
</script>
