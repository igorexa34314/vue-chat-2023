<template>
	<v-card width="100%" max-width="450" variant="tonal" class="pa-2">
		<v-card-item class="mb-3">
			<v-card-title class="text-center">Регистрация</v-card-title>
		</v-card-item>

		<v-card-text class="mt-3">
			<v-form ref="form" v-model="valid" lazy-validation @submit.prevent="submitForm">
				<v-text-field v-model.trim="name" :rules="validations.name" label="Ваше имя" placeholder="Введите ваше имя"
					class="" variant="underlined" counter="16" clearable required />

				<v-text-field v-model.trim="email" :rules="validations.email" label="Ваша почта"
					placeholder="Введите вашу почту" class="mt-4" variant="underlined" clearable required />

				<!-- <v-text-field v-model.trim="password" :type="showPassword ? 'text' : 'password'" :rules="
													validations.password" label="Пароль" placeholder="Введите пароль" class="mt-5" variant="underlined" required>
														<template v-slot:append-inner>
															<v-icon :icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" @mousedown="showPassword = true"
																@mouseup="showPassword = false" class="mr-2" style="cursor: pointer" />
														</template>
													</v-text-field> -->
				<pass-field v-model="password" class="mt-4" repeater />

				<!-- 
													<v-radio-group v-model="gender" inline label="Ваш пол" class="mt-6">
														<v-radio v-for="gender in genderItems" :key="gender.value" :label="gender.name" :value="gender.value"
															color="primary" />
													</v-radio-group> -->

				<v-checkbox v-model="agreeTerms" :rules="validations.terms" required density="compact" class="mt-3">
					<template v-slot:label>
						<div class="">Согласен с <router-link to="" target="_blank">правилами</router-link></div>
					</template>
				</v-checkbox>

				<v-btn type="submit" color="success" class="btn mt-4">
					Регистрация
				</v-btn>
			</v-form>
		</v-card-text>
		<v-card-actions class="flex-column justify-center">
			<div class="providers d-flex">
				<v-btn type="button" @click="signInWithGoogle" variant="plain" stacked density="compact"
					size="small"> <v-img :src="googleImg" width="36px" alt="Войти через Google" /></v-btn>
			</div>
			<div class="mt-4 text-center">Уже зарегистрированы? <router-link to="/login">Войти</router-link></div>
		</v-card-actions>
	</v-card>
</template>

<script setup>
import passField from '@/components/UI/passField.vue';
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useSnackbarStore } from '@/stores/snackbar';
import validations from '@/utils/validations';

const googleImg = new URL('@/assets/img/google.png', import.meta.url).href;

const router = useRouter();
const authStore = useAuthStore();
const snackbar = useSnackbarStore();

const form = ref();
const valid = ref(true);



const name = ref('');
const password = ref('');
const email = ref('');
const agreeTerms = ref(false);



const submitForm = async () => {
	const { valid } = await form.value.validate();

	if (valid) {
		try {
			const user = await authStore.registerWithEmail({
				name: name.value,
				email: email.value,
				password: password.value
			});
			router.push({ path: '/chatroom' });
		} catch (e) {
			snackbar.showMessage(messages[e], 'red-darken-3', 2000);
		}

	}
};
const signInWithGoogle = async () => {
		try {
			await authStore.signInWithGoogle();
			router.push({ path: '/chatroom' });
		} catch (e) {
			snackbar.showMessage(messages[e], 'red-darken-3', 2000);
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