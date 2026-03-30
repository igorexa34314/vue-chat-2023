<template>
	<v-layout>
		<v-main>
			<v-container
				class="d-flex flex-column align-center justify-center"
				style="min-height: 100dvh; min-height: 100vh">
				<v-card
					width="100%"
					min-height="400px"
					:max-width="xs ? 400 : 450"
					variant="tonal"
					class="d-flex flex-column pa-2">
					<v-card-item class="mb-3">
						<v-card-title class="text-center">Enter your name</v-card-title>
					</v-card-item>

					<v-card-text class="mt-3">
						<v-form
							ref="formEl"
							id="enter-name-form"
							lazy-validation
							@submit.prevent="submitForm">
							<v-text-field
								v-model.trim="formState.firstname"
								:rules="validations.firstname"
								label="First name"
								placeholder="Enter your first name"
								class=""
								variant="underlined"
								clearable
								required />

							<v-text-field
								v-model.trim="formState.lastname"
								:rules="validations.lastname"
								label="Last name"
								placeholder="Enter your last name"
								class="mt-3"
								variant="underlined"
								clearable
								required />
						</v-form>
					</v-card-text>
					<v-card-actions class="d-flex justify-space-between">
						<v-btn variant="text" color="success" class="btn mt-4" @click="skipName"
							>Skip this step</v-btn
						>
						<v-btn
							type="submit"
							variant="flat"
							form="enter-name-form"
							color="success"
							class="btn mt-4"
							v-bind="{ loading }"
							>Continue</v-btn
						>
					</v-card-actions>
				</v-card>
			</v-container>
		</v-main>
	</v-layout>
</template>

<script setup lang="ts">
import validations from '@/utils/validations';
import messages from '@/utils/messages.json';
import { ref, useTemplateRef } from 'vue';
import { useHead } from '@unhead/vue';
import { useRouter } from 'vue-router';
import { useSnackbarStore } from '@/stores/snackbar';
import { useDisplay } from 'vuetify';
import { updateUserInfo } from '@/services/user';

useHead({ title: 'Enter your name' });

const { xs } = useDisplay();
const router = useRouter();
const { showMessage } = useSnackbarStore();

const formRef = useTemplateRef('formEl');
const loading = ref(false);
const formState = ref({
	firstname: '',
	lastname: '',
});

const skipName = async () => {
	showMessage('sign_in_success');
	router.push('/profile');
};

const submitForm = async () => {
	const valid = (await formRef.value?.validate())?.valid;
	if (valid) {
		try {
			loading.value = true;
			await updateUserInfo(formState.value);
			router.push('/profile');
		} catch (e) {
			showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
		} finally {
			loading.value = false;
		}
	}
};
</script>
