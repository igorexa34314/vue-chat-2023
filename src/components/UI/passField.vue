<template>
	<div>
		<v-text-field v-model="password" :type="passFieldState.showPass ? 'text' : 'password'" :rules="rules" :label="label"
			:placeholder="placeholder" :variant="variant" required>
			<template v-slot:append-inner>
				<v-icon :icon="passFieldState.showPass ? 'mdi-eye' : 'mdi-eye-off'" @mousedown="passFieldState.showPass = true"
					@mouseup="passFieldState.showPass = false" class="mr-2" style="cursor: pointer" />
			</template>
		</v-text-field>
		<v-text-field v-if="repeater" :type="passFieldState.showRepeater ? 'text' : 'password'" :rules="repeaterRules"
			:label="repeaterLabel" :placeholder="repeaterPlaceholder" :variant="variant || 'underlined'"
			:class="repeaterClass + ` mt-4`" required>
			<template v-slot:append-inner>
				<v-icon :icon="passFieldState.showRepeater ? 'mdi-eye' : 'mdi-eye-off'"
					@mousedown="passFieldState.showRepeater = true" @mouseup="passFieldState.showRepeater = false" class="mr-2"
					style="cursor: pointer" />
			</template>
		</v-text-field>
	</div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import validations from '@/utils/validations';
import { useVModel } from '@vueuse/core';
import type { Password } from '@/utils/validations';

type Variant = "filled" | "outlined" | "plain" | "underlined" | "solo";
interface PassFieldProps {
	modelValue?: Password;
	repeater?: boolean;
	label?: string;
	repeaterLabel?: string;
	placeholder?: string;
	repeaterPlaceholder?: string;
	rules?: ((v: Password) => string) | (((v: Password) => string)[]);
	variant?: Variant;
	repeaterClass?: string;
}
const props = withDefaults(defineProps<PassFieldProps>(), {
	repeater: false,
	placeholder: 'Введите пароль',
	label: 'Пароль',
	rules: validations.password,
	variant: 'underlined',
	repeaterLabel: 'Пароль еще раз',
	repeaterPlaceholder: 'Повторите пароль',
});
const emit = defineEmits<{
	(e: 'update:modelValue', pass: Password): void
}>();

const passFieldState = reactive({
	showPass: false,
	showRepeater: false,
});

const password = useVModel(props, 'modelValue', emit)
const repeaterRules = [(v: Password) => !!v || 'Повторите пароль', (v: Password) => (v && v === password.value) || 'Пароли должны совпадать'];
</script>

<script>
export default { name: 'pass-field' }
</script>

<style lang="scss" scoped></style>