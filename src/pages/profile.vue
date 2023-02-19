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
					<v-img :lazy-src="defaultAvatar" :src="user.photoURL" alt="Ваш аватар" cover />
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
import { ref, computed, onMounted, watch } from 'vue';
import { useSnackbarStore } from '@/stores/snackbar';
import validations from '@/utils/validations';
import messages from '@/utils/messages';

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;

const userdataStore = useUserdataStore();
const snackbar = useSnackbarStore();

const user = computed(() => userdataStore.userdata);

const form = ref();
const valid = ref(true);
const name = ref(user.value.displayName || '');
const gender = ref(user.value.gender || 'unknown');
const avatar = ref();

watch(user, () => {
	name.value = user.value.displayName;
	gender.value = user.value.gender;
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
			await userdataStore.updateUserdata({
				name: name.value,
				gender: gender.value,
				avatar: avatar.value ? avatar.value[0] : null
			});
			avatar.value = [];
			snackbar.showMessage('succesfully_updated');
		} catch (e) {
			console.error(e);
			snackbar.showMessage(messages[e], 'red-darken-3', 2000);
		}

	}
};
</script>

<style lang="scss" scoped></style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>