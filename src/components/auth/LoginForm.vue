<template>
	<v-card width="100%" max-width="450" variant="tonal" class="pa-2">
		<v-card-item class="mb-3">
			<v-card-title class="text-center">Login to chat</v-card-title>
		</v-card-item>

		<v-card-text class="mt-3">
			<v-form ref="formEl" @submit.prevent="submitForm" lazy-validation>
				<v-text-field
					v-model.trim="formState.email"
					:rules="validations.email"
					label="Email"
					placeholder="Enter email"
					class="mt-5"
					variant="underlined"
					clearable
					required />

				<pass-field v-model.trim="formState.password" class="mt-5" />

				<v-btn type="submit" color="success" class="btn mt-6"> Sign In </v-btn>
			</v-form>
		</v-card-text>
		<v-card-actions class="flex-column justify-center">
			<div class="providers d-flex">
				<v-btn type="button" @click="loginWithGoogle" variant="plain" stacked density="compact" size="small">
					<v-img :src="googleImg" eager width="36px" alt="Войти через Google"
				/></v-btn>
			</div>
			<div class="text-center mt-4">Dont have an account? <router-link to="/register">Register</router-link></div>
		</v-card-actions>
	</v-card>
</template>

<script setup lang="ts">
import PassField from '@/components/UI/PassField.vue';
import messages from '@/utils/messages.json';
import validations from '@/utils/validations';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginWithEmail, signInWithGoogle } from '@/services/auth';
import { useSnackbarStore } from '@/stores/snackbar';
import { googleImg } from '@/globals';
import { VForm } from 'vuetify/components';

const { push } = useRouter();
const { showMessage } = useSnackbarStore();

const formEl = ref<VForm>();
const formState = ref({
	email: '',
	password: '',
});

const submitForm = async () => {
	const valid = (await formEl.value?.validate())?.valid;
	if (valid) {
		try {
			await loginWithEmail(formState.value);
			push('/profile');
		} catch (e) {
			showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
		}
	}
};
const loginWithGoogle = async () => {
	try {
		await signInWithGoogle();
		push('/profile');
	} catch (e) {
		showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
	}
};
</script>

<style lang="scss" scoped>
.btn {
	position: relative;
	left: 100%;
	transform: translate(-120%);
}
</style>
