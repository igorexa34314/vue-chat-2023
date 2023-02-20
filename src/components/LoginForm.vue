<template>
	<v-card width="100%" max-width="450" variant="tonal" class="pa-2">
		<v-card-item class="mb-3">
			<v-card-title class="text-center">Войти в чат</v-card-title>
		</v-card-item>

		<v-card-text class="mt-3">
			<v-form ref="form" v-model="valid" @submit.prevent="submitForm" lazy-validation>

				<v-text-field v-model.trim="email" :rules="validations.email" label="Ваша почта" placeholder="Введите почту"
					class="mt-5" variant="underlined" clearable required />

				<pass-field v-model.trim="password" class="mt-5" />

				<v-btn type="submit" color="success" class="btn mt-6">
					Войти
				</v-btn>
			</v-form>
		</v-card-text>
		<v-card-actions class="flex-column justify-center">
			<div class="providers d-flex">
				<v-btn type="button" @click="signInWithGoogle" variant="plain" stacked density="compact" size="small"> <v-img
						:src="googleImg" width="36px" alt="Войти через Google" /></v-btn>
			</div>
			<div class="text-center mt-4">Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link></div>
		</v-card-actions>
	</v-card>
</template>

<script setup>
import passField from '@/components/UI/passField.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSnackbarStore } from '@/stores/snackbar';
import messages from '@/utils/messages';
import validations from '@/utils/validations';

const googleImg = new URL('@/assets/img/google.png', import.meta.url).href;

const router = useRouter();
const authStore = useAuthStore();
const snackbar = useSnackbarStore();

const form = ref();
const valid = ref(true);

const email = ref('');
const password = ref('');

const submitForm = async () => {
	const { valid } = await form.value.validate();

	if (valid) {
		try {
			await authStore.loginWithEmail({
				email: email.value,
				password: password.value,
			});
			router.push({ path: '/profile' });
		} catch (e) {
			snackbar.showMessage(messages[e], 'red-darken-3', 2000);
		}
	}
};
const signInWithGoogle = async () => {
	try {
		await authStore.signInWithGoogle();
		router.push({ path: '/profile' });
	} catch (e) {
		snackbar.showMessage(messages[e], 'red-darken-3', 2000);
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