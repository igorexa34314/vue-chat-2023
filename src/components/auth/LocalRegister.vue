<template>
	<v-form ref="formEl" lazy-validation @submit.prevent="submitForm">
		<v-text-field
			v-model.trim="formState.email"
			:rules="validations.email"
			label="Email"
			placeholder="Enter your email"
			class="mt-4"
			variant="underlined"
			clearable
			required />

		<pass-field v-model="formState.password" class="mt-3" repeater />

		<v-checkbox v-model="formState.agreeTerms" :rules="validations.terms" required density="compact" class="mt-3">
			<template #label>
				<div class="">Agree with <a href="https://uml.ua/pro-licej/himn/" target="_blank">rules</a></div>
			</template>
		</v-checkbox>

		<v-btn type="submit" color="success" class="btn mt-4" v-bind="{ loading }">Register</v-btn>
	</v-form>
</template>

<script setup lang="ts">
import PassField from '@/components/UI/PassField.vue';
import validations from '@/utils/validations';
import { ref } from 'vue';
import { AuthService } from '@/services/auth';
import type { VForm } from 'vuetify/components';
import type { User } from 'firebase/auth';

const emit = defineEmits<{
	success: [user?: User];
	error: [err: unknown];
}>();

const formEl = ref<VForm | null>(null);
const loading = ref(false);
const formState = ref({
	password: '',
	email: '',
	agreeTerms: false,
});

const submitForm = async () => {
	const valid = (await formEl.value?.validate())?.valid;
	if (valid) {
		const { agreeTerms, ...formData } = formState.value;
		try {
			loading.value = true;
			const user = await AuthService.registerWithEmail(formData);
			emit('success', user);
		} catch (e) {
			emit('error', e);
		} finally {
			loading.value = false;
		}
	}
};
</script>

<style lang="scss" scoped>
.btn {
	position: relative;
	left: 100%;
	transform: translate(-110%);
}
</style>
