<template>
	<div class="birthday-picker">
		<v-select v-for="dp in datePickerState" :key="dp.type" :label="dp.title" :items="dp.items" v-model="dp.value"
			density="compact" class="mr-4" variant="outlined" :class="`${dp.type}-select`" />
	</div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useDateFormat } from "@/utils/dateFormat";

const { monthsForLocale } = useDateFormat();

const props = defineProps({
	modelValue: {
		type: Date,
		default: new Date(),
	}
});
const emit = defineEmits<{
	(e: 'update:modelValue', date: Date): void
}>();

const datePickerState = ref([
	{ type: 'month', title: 'Месяц', value: props.modelValue.getMonth() + 1, items: monthsForLocale('ru-RU', 'long').map((title, i) => ({ title, value: ++i })) },
	{ type: 'day', title: 'День', value: props.modelValue.getDate(), items: Array.from({ length: 31 }, (v, i) => ++i) },
	{ type: 'year', title: 'Год', value: props.modelValue.getFullYear(), items: Array.from({ length: 100 }, (v, i) => (new Date().getFullYear() - 99) + i).reverse() },
]);

watchEffect(() => emit('update:modelValue', new Date(datePickerState.value.map(item => item.value).join('-'))));
</script>

<style lang="scss" scoped>
.birthday-picker {
	display: flex;
	align-items: center;
}
.day-select {
	order: 1;
}
.month-select {
	order: 2;
}
.year-select {
	order: 3;
}
</style>