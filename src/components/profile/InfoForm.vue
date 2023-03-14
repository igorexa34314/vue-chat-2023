<template>
	<v-form ref="formEl" @submit.prevent="submitForm" lazy-validation class="pa-4 mt-2">
		<v-text-field v-model.trim="formState.displayName" :rules="validations.name" label="Ваше имя"
			placeholder="Введите ваше имя" class="" variant="underlined" counter="16" clearable required
			style="max-width: 600px" />

		<v-radio-group v-model="formState.gender" inline label="Ваш пол" class="mt-6">
			<v-radio v-for="(gender, index) in genderItems" :key="gender.value" :label="gender.name" :value="gender.value"
				:color="index === 0 ? 'blue-darken-3' : 'red-darken-3'" class="mr-2" />
		</v-radio-group>

		<birthdayPicker v-model="<Date>formState.birthday_date" class="birthday-picker mt-5" />

		<div class="w-50 mt-5">
			<v-card variant="outlined" max-width="250" class="mb-5" elevation="9">
				<v-img :lazy-src="defaultAvatar" :src="formState.photoURL || defaultAvatar" alt="Ваш аватар" cover />
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

<script setup lang="ts">
import birthdayPicker from '@/components/UI/birthdayPicker.vue';
import validations from '@/utils/validations';
import { ref, watchEffect, reactive } from 'vue';
import type { UserInfo } from '@/types/db/UserdataTable';
import type { VForm } from 'vuetify/components';

export interface ProfileForm extends Partial<UserInfo> {
	avatar: File[];
}

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;

const props = defineProps<{
	uinfo: UserInfo
}>();

const emit = defineEmits<{
	(e: 'submit', data: ProfileForm): void
}>();

const formEl = ref<VForm>();
const formState: ProfileForm = reactive({
	displayName: '',
	gender: 'unknown',
	birthday_date: new Date(),
	photoURL: '',
	avatar: [],
});

const genderItems = [
	{ name: 'Мужской', value: 'male' },
	{ name: 'Женский', value: 'female' },
	{ name: 'Не указывать', value: 'unknown' },
];

// fillProfileForm
watchEffect(() => {
	if (Object.keys(props.uinfo).length) {
		formState.displayName = props.uinfo.displayName as string;
		formState.gender = props.uinfo.gender || 'unknown';
		formState.birthday_date = props.uinfo.birthday_date as Date || new Date();
		formState.photoURL = props.uinfo.photoURL as string;
	}
});

const submitForm = async () => {
	const valid = (await formEl.value?.validate())?.valid;
	if (valid) {
		emit('submit', formState);
		formState.avatar = [];
	}
};
</script>

<style lang="scss" scoped>
.birthday-picker {
	max-width: 550px;
}
</style>