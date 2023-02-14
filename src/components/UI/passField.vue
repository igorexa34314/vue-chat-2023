<template>
	<v-text-field :v-model="repeater !== undefined password" :type="showPassword ? 'text' : 'password'"
		:rules="rules || (repeater !== undefined ? repeaterRules : passwordRules)"
		:label="label || (repeater !== undefined ? 'Повторите пароль' : 'Пароль')"
		:placeholder="placeholder || (repeater !== undefined ? 'Повторите пароль' : 'Введите пароль')"
		variant="underlined" required>
		<template v-slot:append-inner>
			<v-icon :icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" @mousedown="showPassword = true"
				@mouseup="showPassword = false" class="mr-2" style="cursor: pointer" />
		</template>
	</v-text-field>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
	modelValue: [String],
	repeater: [String],
	label: [String],
	placeholder: [String],
	rules: { type: [Array, String] },
});
const showPassword = ref(false);
const password = computed({
	get: () => props.modelValue,
	set: value => emit('update:modelValue', value)
});
const passwordRules = [
	v => !!v || 'Введите пароль',
	v => (v && v.length >= 6 && v.length <= 32) || 'Пароль должен быть в пределах от 6 до 32 символов',
];
const repeaterRules = [
	v => !!v || 'Повторите пароль',
	v => (v && v === props.repeater) || 'Пароли должны совпадать',
];
</script>

<script>export default { name: 'pass-field' }</script>

<style lang="scss" scoped>

</style>