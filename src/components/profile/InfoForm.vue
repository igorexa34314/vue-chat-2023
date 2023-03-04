<template>
	<v-form ref="formEl" @submit.prevent="submitForm" lazy-validation class="pa-4 mt-2">
		<v-text-field v-model.trim="formState.displayName" :rules="validations.name" label="Ваше имя"
			placeholder="Введите ваше имя" class="" variant="underlined" counter="16" clearable required
			style="max-width: 600px" />

		<v-radio-group v-model="formState.gender" inline label="Ваш пол" class="mt-6">
			<v-radio v-for="(gender, index) in genderItems" :key="gender.value" :label="gender.name" :value="gender.value"
				:color="index === 0 ? 'blue-darken-3' : 'red-darken-3'" class="mr-2" />
		</v-radio-group>

		<birthdayPicker v-model="formState.birthdayDate" class="birthday-picker mt-5" />

		<div class="w-50 mt-5">
			<v-card variant="outlined" max-width="250" class="mb-5" elevation="9">
				<v-img :lazy-src="defaultAvatar" :src="profileURL" alt="Ваш аватар" cover />
			</v-card>
			<div class="mb-4">Загрузите ваше фото</div>
			<v-file-input v-model="formState.avatar" label="Аватар" :rules="validations.file" variant="solo"
				placeholder="Загрузите аватар" accept="image/* " density="comfortable" single-line style="max-width: 550px;" />
		</div>

		<v-btn type="submit" color="success" class="btn mt-5">
			Применить
		</v-btn>
	</v-form>
</template>

<script setup>
import birthdayPicker from '@/components/UI/birthdayPicker.vue';
import { ref, watchEffect, reactive } from 'vue';
import validations from '@/utils/validations';

const props = defineProps({
	userdata: {
		type: Object,
		required: true,
	}
});
const emit = defineEmits(['submit']);

const formEl = ref();
const formState = reactive({
	displayName: '',
	gender: '',
	birthdayDate: new Date(),
	avatar: []
});
let profileURL = '';

const genderItems = [
	{ name: 'Мужской', value: 'male' },
	{ name: 'Женский', value: 'female' },
	{ name: 'Не указывать', value: 'unknown' },
];

const fillProfileForm = () => {
	if (props.userdata.info && Object.keys(props.userdata.info).length) {
		formState.displayName = props.userdata.info.displayName;
		formState.gender = props.userdata.info.gender || 'unknown';
		formState.birthdayDate = props.userdata.info.birthday_date || new Date();
		profileURL = props.userdata.info.photoURL;
	}
};

watchEffect(() => {
	fillProfileForm();
});

const submitForm = async () => {
	const { valid } = await formEl.value.validate();
	if (valid) {
		const { avatar, ...data } = formState;
		emit('submit', {
			...data,
			avatar: formState.avatar.length ? formState.avatar[0] : null
		});
		formState.avatar = [];
	}
};

</script>

<style lang="scss" scoped>
.birthday-picker {
	max-width: 550px;
}
</style>