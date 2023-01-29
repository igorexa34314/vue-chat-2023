<template>
	<v-card width="100%" max-width="450" variant="tonal" class="pa-2">
		<v-card-item class="mb-3">
			<v-card-title class="text-center">Войти в чат</v-card-title>
		</v-card-item>

		<v-card-text class="mt-3">
			<v-form ref="form" v-model="valid" lazy-validation>
				<v-text-field v-model="name" :rules="nameRules" label="Ваше имя" class="" variant="underlined" counter="16"
					clearable required />

				<v-text-field v-model="email" :rules="emailRules" label="Ваша почта" class="mt-5" variant="underlined"
					clearable required />

				<v-text-field v-model="room" :rules="roomRules" label="Номер комнаты" class="mt-5" variant="underlined"
					clearable required />

				<v-radio-group v-model="gender" inline label="Ваш пол" class="mt-6">
					<v-radio v-for="gender in genderItems" :key="gender.value" :label="gender.name" :value="gender.value"
						color="primary" />
				</v-radio-group>

				<v-checkbox v-model="agreeTerms" :rules="[v => !!v || 'Вы должны согласиться с правилами!']" required
					density="compact">
					<template v-slot:label>
						<div class="">Согласен с <a href="#" target="_blank">правилами</a></div>
					</template>
				</v-checkbox>

				<v-btn color="success" class="btn mt-3" @click="submitForm">
					Войти
				</v-btn>
			</v-form>
		</v-card-text>
	</v-card>

</template>

<script setup>
import { useUsersStore } from '@/stores/users';

const ctx = useNuxtApp();
let socket = null;
ctx.onUnmounted = onUnmounted;
const usersStore = useUsersStore();
const form = ref();
const genderItems = [
	{ name: 'Мужской', value: 'male' },
	{ name: 'Женский', value: 'female' },
	{ name: 'Не указывать', value: 'unknown' },
];
const gender = ref('unknown');
const valid = ref(true);
const name = ref('');
const nameRules = [
	v => !!v || 'Введите имя',
	v => (v && v.length >= 2 && v.length <= 16) || 'Имя должно быть в пределах от 2 до 16 символов',
];
const room = ref('');
const roomRules = [
	v => !!v || 'Введите номер комнаты',
	v => (v % 1 === 0) || 'Номер комнаты должен быть числом',
];
const email = ref('');
const emailRules = [
	v => !!v || 'Введите почту',
	v => /.+@.+\..+/.test(v) || 'Введите корректную почту',
];
onMounted(() => {
	socket = ctx.$nuxtSocket({
		name: 'main',
	})
});

const agreeTerms = ref(false);
const submitForm = async () => {
	const { valid } = await form.value.validate();

	if (valid) {
		const user = {
			name: name,
			email: email,
			gender: gender,
			room: room,
		}
		socket.emit('userJoined', user, data => {
			console.log(data);
			if (data.emitError) {
				console.error(data.emitError);
			} else {
				user.id = data.userId;
				usersStore.setUser(user);
				console.log(ctx.$ioState().value.messages);
				navigateTo('/chatroom');
			}
		});
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