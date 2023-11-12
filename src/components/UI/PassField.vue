<template>
	<div>
		<v-text-field
			v-model="password"
			:type="passFieldState.showPass ? 'text' : 'password'"
			:rules="rules || validations.password"
			:label="label"
			:placeholder="placeholder"
			:variant="variant"
			autocomplete="on"
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
			:rules="validations.repeater(password)"
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
import type { VTextField } from 'vuetify/components';

type Password = VTextField['modelValue'];

const {
	placeholder = 'Enter password',
	label = 'Password',
	variant = 'underlined',
	repeater,
	repeaterClass,
	rules,
	repeaterLabel = 'Repeat password',
	repeaterPlaceholder = 'Repeat your password',
} = defineProps<{
	repeater?: boolean;
	label?: VTextField['label'];
	repeaterLabel?: string;
	placeholder?: VTextField['placeholder'];
	repeaterPlaceholder?: VTextField['placeholder'];
	rules?: ((v: Password) => boolean | string)[];
	variant?: VTextField['variant'];
	repeaterClass?: string;
}>();

const passFieldState = ref({
	showPass: false,
	showRepeater: false,
});

const password = defineModel<Password>('modelValue', { default: '' });
</script>
