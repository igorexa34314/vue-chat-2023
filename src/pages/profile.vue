<template>
	<section class="mt-5 pa-5">
		<h2 class="ml-4 mt-5">Ваш профиль</h2>
		<v-form v-if="Object.keys(userdata).length" ref="form" @submit.prevent="submitForm" lazy-validation
			class="pa-4 mt-6">
			<v-text-field v-model.trim="formState.displayName" :rules="validations.name" label="Ваше имя"
				placeholder="Введите ваше имя" class="" variant="underlined" counter="16" clearable required />

			<v-radio-group v-model="formState.gender" inline label="Ваш пол" class="mt-6">
				<v-radio v-for="(gender, index) in genderItems" :key="gender.value" :label="gender.name" :value="gender.value"
					:color="index === 0 ? 'blue-darken-3' : 'red-darken-3'" class="mr-2" />
			</v-radio-group>

			<div class="w-50 mt-5">
				<v-card variant="outlined" max-width="200" class="mb-4" elevation="9">
					<v-img :lazy-src="defaultAvatar" :src="profileURL" alt="Ваш аватар" cover />
				</v-card>
				<div class="mb-4">Загрузите ваше фото</div>
				<v-file-input v-model="formState.avatar" label="Аватар" :rules="validations.file" variant="solo"
					placeholder="Загрузите аватар" accept="image/* " density="comfortable" single-line />
			</div>

			<v-btn type="submit" color="success" class="btn mt-5">
				Применить
			</v-btn>
		</v-form>
		<div v-else><page-loader /></div>
	</section>
</template>

<script setup>
import pageLoader from '@/components/UI/pageLoader.vue'
import { useUserdataStore } from '@/stores/userdata';
import { ref, inject, watchEffect, reactive } from 'vue';
import { useSnackbarStore } from '@/stores/snackbar';
import validations from '@/utils/validations';
import messages from '@/utils/messages';

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;

const { updateUserdata } = useUserdataStore();
const { showMessage } = useSnackbarStore();
const userdata = inject('userdata');

const form = ref();
const formState = reactive({
	displayName: '',
	gender: '',
	avatar: []
});
let profileURL = '';

const fillProfileForm = () => {
	if (userdata.value.info && Object.keys(userdata.value.info).length) {
		formState.displayName = userdata.value.info.displayName;
		formState.gender = userdata.value.info.gender;
		profileURL = userdata.value.info.photoURL;
	}
};

fillProfileForm();
watchEffect(() => {
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
				displayName: formState.displayName,
				gender: formState.gender,
				avatar: formState.avatar.length ? formState.avatar[0] : null
			});
			formState.avatar = [];
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