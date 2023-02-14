<template>
	<v-card width="100%" max-width="450" variant="tonal" class="pa-2">
		<v-card-item class="mb-3">
			<v-card-title class="text-center">Войти в чат</v-card-title>
		</v-card-item>

		<v-card-text class="mt-3">
			<v-form ref="form" v-model="valid" lazy-validation>
				<v-text-field v-model.trim="name" :rules="nameRules" label="Ваше имя" class="" variant="underlined"
					counter="16" clearable required />

				<v-text-field v-model.trim="email" :rules="emailRules" label="Ваша почта" class="mt-5" variant="underlined"
					clearable required />

				<pass-field v-model="password" class="mt-5" />


				<v-btn color="success" class="btn mt-3" @click="submitForm">
					Войти
				</v-btn>
			</v-form>
		</v-card-text>
	</v-card>

</template>

<script setup>
import { ref } from 'vue';
import { useUserdataStore } from '@/stores/userdata';
import { useRouter } from 'vue-router';

const router = useRouter();
const userdataStore = useUserdataStore();
const form = ref();
const valid = ref(true);
const password = ref('');

const email = ref('');
const emailRules = [
	v => !!v || 'Введите почту',
	v => /.+@.+\..+/.test(v) || 'Введите корректную почту',
];

const submitForm = async () => {
	const { valid } = await form.value.validate();

	if (valid) {
		const user = await userdataStore.addInfoToDB({
			email: email.value,
			password: password.value,
		});
		console.log(user);
		return router.push({ path: '/chatroom' });
	}
};
</script>

<style lang="scss" scoped>
.btn {
	position: relative;
	left: 100%;
	transform: translate(-100%);
}
</style>