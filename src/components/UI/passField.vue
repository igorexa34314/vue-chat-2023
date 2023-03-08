<template>
	<div>
		<v-text-field v-model="password" :type="showPassword ? 'text' : 'password'" :rules="rules || validations.password"
			:label="label || 'Пароль'" :placeholder="placeholder || 'Введите пароль'" :variant="variant || 'underlined'"
			required>
			<template v-slot:append-inner>
				<v-icon :icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" @mousedown="showPassword = true"
					@mouseup="showPassword = false" class="mr-2" style="cursor: pointer" />
			</template>
		</v-text-field>
		<v-text-field v-if="repeater" :type="showRepeatedPassword ? 'text' : 'password'" :rules="repeaterRules"
			:label="repeaterLabel || 'Пароль еще раз'" :placeholder="repeaterPlaceholder || 'Повторите пароль'"
			:variant="variant || 'underlined'" :class="repeaterClass + ` mt-4`" required>
			<template v-slot:append-inner>
				<v-icon :icon="showRepeatedPassword ? 'mdi-eye' : 'mdi-eye-off'" @mousedown="showRepeatedPassword = true"
					@mouseup="showRepeatedPassword = false" class="mr-2" style="cursor: pointer" />
			</template>
		</v-text-field>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import validations from '@/utils/validations';
import { useVModel } from '@vueuse/core';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
	modelValue: [String],
	repeater: { type: Boolean, default: false },
	label: [String],
	repeaterLabel: [String],
	placeholder: [String],
	repeaterPlaceholder: [String],
	rules: { type: [Array, String] },
	variant: [String],
	repeaterClass: [String]
});
const showPassword = ref(false);
const showRepeatedPassword = ref(false);

const password = useVModel(props, 'modelValue', emit)
const repeaterRules = [v => !!v || 'Повторите пароль', v => (v && v === password.value) || 'Пароли должны совпадать'];
</script>

<script>
export default { name: 'pass-field' }
</script>

<style lang="scss" scoped></style>