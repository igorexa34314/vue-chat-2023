<template>
	<v-card width="100%" max-width="450" variant="tonal" class="pa-2">
		<v-card-item class="mb-3">
			<v-card-title class="text-center">Register</v-card-title>
		</v-card-item>
		<v-card-text class="mt-3">
			<v-form ref="formEl" lazy-validation @submit.prevent="submitForm">

				<v-text-field v-model.trim="formState.displayName" :rules="validations.name" label="Display name"
					placeholder="Enter your display name" class="" variant="underlined" counter="16" clearable required />

				<v-text-field v-model.trim="formState.email" :rules="validations.email" label="Email"
					placeholder="Enter your email" class="mt-4" variant="underlined" clearable required />

				<pass-field v-model="formState.password" class="mt-4" repeater />

				<v-checkbox v-model="formState.agreeTerms" :rules="validations.terms" required density="compact" class="mt-3">
					<template #label>
						<div class="">Agree with <a href="https://uml.ua/pro-licej/himn/" target="_blank">rules</a></div>
					</template>
				</v-checkbox>

				<v-btn type="submit" color="success" class="btn mt-4">
					Register
				</v-btn>
			</v-form>
		</v-card-text>
		<v-card-actions class="flex-column justify-center">
			<div class="providers d-flex">
				<v-btn type="button" @click="signWithGoogle" variant="plain" stacked density="compact" size="small"> <v-img
						:src="googleImg" width="36px" alt="Войти через Google" eager /></v-btn>
			</div>
			<div class="mt-4 text-center">Have an account? <router-link to="/login">Sign In</router-link></div>
		</v-card-actions>
	</v-card>
</template>

<script setup lang="ts">
import PassField from '@/components/UI/PassField.vue';
import validations from '@/utils/validations';
import messages from '@/utils/messages.json';
import { ref } from 'vue';
import { registerWithEmail, signInWithGoogle } from '@/services/auth';
import { useRouter } from 'vue-router';
import { useSnackbarStore } from '@/stores/snackbar';
import { googleImg } from '@/globals';
import { VForm } from 'vuetify/components';

const { push } = useRouter();
const { showMessage } = useSnackbarStore();

const formEl = ref<VForm>();
const formState = ref({
	displayName: '',
	password: '',
	email: '',
	agreeTerms: false
});

const submitForm = async () => {
	const valid = (await formEl.value?.validate())?.valid;
	if (valid) {
		const { agreeTerms, ...formData } = formState.value
		try {
			await registerWithEmail(formData);
			push('/profile');
		} catch (e) {
			showMessage(messages[e as keyof typeof messages] || e as string, 'red-darken-3', 2000);
		}
	}
};
const signWithGoogle = async () => {
	try {
		await signInWithGoogle();
		push('/profile');
	} catch (e) {
		showMessage(messages[e as keyof typeof messages] || e as string, 'red-darken-3', 2000);
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