<template>
	<div>
		<v-text-field
			v-model="password"
			:type="passFieldState.showPass ? 'text' : 'password'"
			:rules="rules || validations.password"
			:label="label"
			:placeholder="placeholder"
			:variant="variant"
			required>
			<template #append-inner>
				<v-icon
					:icon="passFieldState.showPass ? mdiEye : mdiEyeOff"
					@mousedown="passFieldState.showPass = true"
					@mouseup="passFieldState.showPass = false"
					class="mr-2"
					style="cursor: pointer" />
			</template>
		</v-text-field>

		<v-text-field
			v-if="repeater"
			:type="passFieldState.showRepeater ? 'text' : 'password'"
			:rules="repeaterRules"
			:label="repeaterLabel"
			:placeholder="repeaterPlaceholder"
			:variant="variant || 'underlined'"
			:class="repeaterClass + ` mt-4`"
			required>
			<template #append-inner>
				<v-icon
					:icon="passFieldState.showRepeater ? mdiEye : mdiEyeOff"
					@mousedown="passFieldState.showRepeater = true"
					@mouseup="passFieldState.showRepeater = false"
					class="mr-2"
					style="cursor: pointer" />
			</template>
		</v-text-field>
	</div>
</template>

<script setup lang="ts">
import { mdiEye, mdiEyeOff } from '@mdi/js';
import { ref } from 'vue';
import validations from '@/utils/validations';
import { useVModel } from '@vueuse/core';

type Password = string;
type Variant = 'filled' | 'outlined' | 'plain' | 'underlined' | 'solo';
interface PassFieldProps {
	modelValue?: Password;
	repeater?: boolean;
	label?: string;
	repeaterLabel?: string;
	placeholder?: string;
	repeaterPlaceholder?: string;
	rules?: ((v: Password) => boolean | string)[];
	variant?: Variant;
	repeaterClass?: string;
}
const props = withDefaults(defineProps<PassFieldProps>(), {
	repeater: false,
	placeholder: 'Enter password',
	label: 'Password',
	variant: 'underlined',
	repeaterLabel: 'Repeat password',
	repeaterPlaceholder: 'Repeat your password',
});
const emit = defineEmits<{
	'update:modelValue': [pass: Password];
}>();

const passFieldState = ref({
	showPass: false,
	showRepeater: false,
});

const password = useVModel(props, 'modelValue', emit);
const repeaterRules = [
	(v: Password) => !!v || 'Repeat your password',
	(v: Password) => (v && v === password.value) || 'Passwords should match',
];
</script>
