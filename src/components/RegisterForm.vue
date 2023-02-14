<template>
	<v-card width="100%" max-width="450" variant="tonal" class="pa-2">
		<v-card-item class="mb-3">
			<v-card-title class="text-center">Регистрация</v-card-title>
		</v-card-item>

		<v-card-text class="mt-3">
			<v-form ref="form" v-model="valid" lazy-validation>
				<v-text-field v-model.trim="name" :rules="validations.name" label="Ваше имя" placeholder="Введите ваше имя"
					class="" variant="underlined" counter="16" clearable required />

				<v-text-field v-model.trim="email" :rules="validations.email" label="Ваша почта"
					placeholder="Введите вашу почту" class="mt-5" variant="underlined" clearable required />

				<!-- <v-text-field v-model.trim="password" :type="showPassword ? 'text' : 'password'" :rules="
				validations.password" label="Пароль" placeholder="Введите пароль" class="mt-5" variant="underlined" required>
					<template v-slot:append-inner>
						<v-icon :icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" @mousedown="showPassword = true"
							@mouseup="showPassword = false" class="mr-2" style="cursor: pointer" />
					</template>
				</v-text-field> -->
				<pass-field v-model="password" class="mt-5" />
				<pass-field :repeater="password" class="mt-5" />

				<!-- 
				<v-radio-group v-model="gender" inline label="Ваш пол" class="mt-6">
					<v-radio v-for="gender in genderItems" :key="gender.value" :label="gender.name" :value="gender.value"
						color="primary" />
				</v-radio-group> -->

				<v-checkbox v-model="agreeTerms" :rules="validations.terms" required density="compact">
					<template v-slot:label>
						<div class="">Согласен с <router-link to="/rules" target="_blank">правилами</router-link></div>
					</template>
				</v-checkbox>

				<v-btn color="success" class="btn mt-3" @click="submitForm">
					Зарегистрироваться
				</v-btn>
			</v-form>
		</v-card-text>
	</v-card>

</template>

<script setup>
import passField from '@/components/UI/passField.vue';
import { ref } from 'vue';
import { useUserdataStore } from '@/stores/userdata';
import { useRouter } from 'vue-router';

const router = useRouter();
const userdataStore = useUserdataStore();

const form = ref();
const valid = ref(true);

// const gender = ref('unknown');
// const genderItems = [
// 	{ name: 'Мужской', value: 'male' },
// 	{ name: 'Женский', value: 'female' },
// 	{ name: 'Не указывать', value: 'unknown' },
// ];

const name = ref('');
const password = ref('');
const email = ref('');
const agreeTerms = ref(false);

const validations = {
	name: [
		v => !!v || 'Введите имя',
		v => (v && v.length >= 2 && v.length <= 16) || 'Имя должно быть в пределах от 2 до 16 символов',
	],
	email: [
		v => !!v || 'Введите почту',
		v => /.+@.+\..+/.test(v) || 'Введите корректную почту',
	],
	terms: [
		v => !!v || 'Вы должны согласиться с правилами'
	],
};

const submitForm = async () => {
	const { valid } = await form.value.validate();

	if (valid) {
		const user = await userdataStore.addInfoToDB({
			name: name.value,
			email: email.value,
			password: password.value
			// gender: gender.value,
			// room: room.value,
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