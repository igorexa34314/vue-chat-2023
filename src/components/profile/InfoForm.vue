<template>
	<v-form ref="formEl" @submit.prevent="submitForm" lazy-validation class="pa-4 mt-2"
		style="position: relative; overflow: auto;">
		<v-text-field v-model.trim="formState.displayName" :rules="validations.name" label="Display name"
			placeholder="Enter your name" class="" variant="underlined" counter="16" clearable required
			style="max-width: 600px" />

		<v-radio-group v-model="formState.gender" inline label="Gender" class="mt-6">
			<v-radio v-for="(gender, index) in genderItems" :key="gender.value" :label="gender.name" :value="gender.value"
				:color="index === 0 ? 'blue-darken-3' : 'red-darken-3'" class="mr-2" />
		</v-radio-group>

		<birthday-picker v-model="<Date>formState.birthday_date" class="birthday-picker mt-5" />

		<div class="w-50 mt-5">
			<v-card variant="outlined" max-width="250" class="mb-5" elevation="9">
				<v-img :lazy-src="defaultAvatar" :src="formState.photoURL || defaultAvatar" alt="Photo URL" cover eager
					#placeholder>
					<ImageLoader />
				</v-img>
			</v-card>

			<div class="mb-4">Upload your avatar</div>
			<v-file-input v-model="formState.avatar" label="Avatar" :rules="validations.file" variant="solo"
				placeholder="Upload avatar" accept="image/* " density="comfortable" single-line style="max-width: 550px;" />
		</div>

		<v-btn type="submit" color="success" class="btn mt-5"
			:disabled="JSON.stringify(uinfo) === JSON.stringify(formState)">
			Apply
		</v-btn>
	</v-form>
</template>

<script setup lang="ts">
import ImageLoader from '@/components/chat/ImageLoader.vue';
import BirthdayPicker from '@/components/UI/BirthdayPicker.vue';
import validations from '@/utils/validations';
import { ref } from 'vue';
import { defaultAvatar } from '@/globals';
import { UserInfo } from '@/types/db/UserdataTable';
import { VForm } from 'vuetify/components';

export interface ProfileForm extends Omit<UserInfo, 'created_at' | 'uid' | 'providerId'> {
	avatar?: File[];
}

const props = defineProps<{
	uinfo: ProfileForm
}>();

const emit = defineEmits<{
	submit: [data: ProfileForm]
}>();

const formEl = ref<VForm>();
const formState = ref<ProfileForm>({ ...props.uinfo });

const genderItems = [
	{ name: 'Мужской', value: 'male' },
	{ name: 'Женский', value: 'female' },
	{ name: 'Не указывать', value: 'unknown' },
];

const submitForm = async () => {
	const valid = (await formEl.value?.validate())?.valid;
	if (valid) {
		emit('submit', formState.value);
		formState.value.avatar = [];
	}
};
</script>

<style lang="scss" scoped>
.birthday-picker {
	max-width: 550px;
}
</style>