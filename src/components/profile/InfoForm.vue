<template>
	<v-form
		ref="formEl"
		@submit.prevent="submitForm"
		lazy-validation
		class="overflow-auto pa-4 mt-2"
		style="position: relative">
		<div class="d-sm-flex">
			<v-text-field
				v-model.trim="formState.firstname"
				:rules="validations.firstname"
				label="First name"
				placeholder="Enter your first name"
				variant="underlined"
				class="mr-sm-3"
				clearable
				required
				style="max-width: 600px" />
			<v-text-field
				v-model.trim="formState.lastname"
				:rules="validations.lastname"
				label="Last name"
				placeholder="Enter your last name"
				variant="underlined"
				class="ml-sm-3"
				clearable
				required
				style="max-width: 600px" />
		</div>

		<v-radio-group v-model="formState.gender" :inline="!xs" label="Gender" class="mt-3 mt-md-6">
			<v-radio
				v-for="(gender, index) in genderItems"
				:key="gender.value"
				:label="gender.name"
				:value="gender.value"
				:color="index === 0 ? 'blue-darken-3' : 'red-darken-3'"
				class="mr-2" />
		</v-radio-group>

		<birthday-picker v-model="formState.birthday_date" class="birthday-picker mt-5" max-width="550" />

		<div class="mt-3 mt-md-5" style="max-width: 500px">
			<v-card variant="outlined" max-width="250" class="mb-5" elevation="9">
				<v-img :lazy-src="defaultAvatar" :src="info.photoURL || defaultAvatar" alt="Photo URL" cover eager>
					<template #placeholder>
						<ImageLoader />
					</template>
				</v-img>
			</v-card>

			<div class="mb-4">Upload your avatar</div>
			<v-file-input
				v-model="formState.avatar"
				label="Avatar"
				:rules="validations.file"
				variant="solo"
				placeholder="Upload avatar"
				accept="image/* "
				density="comfortable"
				single-line
				style="max-width: 550px" />
		</div>

		<v-btn type="submit" color="success" class="btn mt-3 mt-md-5">Apply</v-btn>
	</v-form>
</template>

<script setup lang="ts">
import ImageLoader from '@/components/chat/ImageLoader.vue';
import BirthdayPicker from '@/components/UI/BirthdayPicker.vue';
import validations from '@/utils/validations';
import { ref } from 'vue';
import { useDisplay } from 'vuetify';
import { defaultAvatar } from '@/global-vars';
import { type PublicUserInfo } from '@/services/user';
import type { VForm } from 'vuetify/components';

export interface IProfileForm extends Pick<PublicUserInfo, 'firstname' | 'lastname' | 'gender' | 'birthday_date'> {
	birthday_date: Date;
	avatar: File[];
}

const { uinfo: info } = defineProps<{
	uinfo: PublicUserInfo;
}>();

const emit = defineEmits<{
	submit: [data: IProfileForm];
}>();

const { xs } = useDisplay();
const formEl = ref<VForm | null>(null);
const formState = ref<IProfileForm>({
	firstname: info.firstname,
	lastname: info.lastname,
	gender: info.gender || 'unknown',
	birthday_date: info.birthday_date || new Date(),
	avatar: [],
});

const genderItems = [
	{ name: 'Male', value: 'male' },
	{ name: 'Female', value: 'female' },
	{ name: 'Unknown', value: 'unknown' },
];

const submitForm = async () => {
	const valid = (await formEl.value?.validate())?.valid;
	if (valid) {
		emit('submit', formState.value);
		formState.value.avatar = [];
	}
};
</script>
