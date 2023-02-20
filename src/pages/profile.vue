<template>
	<section class="mt-5 pa-5">
		<h2 class="ml-4 mt-5">Ваш профиль</h2>
		<v-form ref="form" v-model="valid" @submit.prevent="submitForm" lazy-validation class="pa-4 mt-6">
			<v-text-field v-model.trim="name" :rules="validations.name" label="Ваше имя" placeholder="Введите ваше имя"
				class="" variant="underlined" counter="16" clearable required />

			<!-- <pass-field v-model="password" class="mt-4" repeater /> -->

			<v-radio-group v-model="gender" inline label="Ваш пол" class="mt-6">
				<v-radio v-for="gender in genderItems" :key="gender.value" :label="gender.name" :value="gender.value"
					color="primary" />
			</v-radio-group>
			<div class="w-50 mt-5">

				<v-card variant="outlined" max-width="200" class="mb-4" elevation="9">
					<v-img :lazy-src="defaultAvatar" :src="profileURL" alt="Ваш аватар" cover />
				</v-card>
				<div class="mb-4">Загрузите ваше фото</div>
				<v-file-input v-model="avatar" label="Аватар" :rules="validations.file" variant="solo"
					placeholder="Загрузите аватар" accept="image/* " density="comfortable" single-line />
			</div>

			<v-btn type="submit" color="success" class="btn mt-5">
				Применить
			</v-btn>
		</v-form>
	</section>
</template>

<script setup>
import { useUserdataStore } from '@/stores/userdata';
import { ref, watch, inject } from 'vue';
import { useSnackbarStore } from '@/stores/snackbar';
import validations from '@/utils/validations';
import messages from '@/utils/messages';

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;

const { updateUserdata } = useUserdataStore();
const { showMessage } = useSnackbarStore();

const userdata = inject('userdata');

const form = ref();
const valid = ref(true);
const name = ref('');
const gender = ref('unknown');
const avatar = ref();
let profileURL = '';

const fillProfileForm = () => {
	if (userdata.value.info && Object.keys(userdata.value.info).length) {
		name.value = userdata.value.info.displayName;
		gender.value = userdata.value.info.gender;
		profileURL = userdata.value.info.photoURL;
	}
};

fillProfileForm();
watch(userdata, () => {
	fillProfileForm();
});

const genderItems = [
	{ name: 'Мужской', value: 'male' },
	{ name: 'Женский', value: 'female' },
	{ name: 'Не указывать', value: 'unknown' },
];
const submitForm = async () => {
	const { valid } = await form.value.validate();
	if (valid) {
		try {
			await updateUserdata({
				name: name.value,
				gender: gender.value,
				avatar: avatar.value ? avatar.value[0] : null
			});
			avatar.value = [];
			showMessage('succesfully_updated');
		} catch (e) {
			console.error(e);
			showMessage(messages[e], 'red-darken-3', 2000);
		}

	}
};
</script>

<style lang="scss" scoped></style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>