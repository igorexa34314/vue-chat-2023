<template>
	<v-form ref="formEl" @submit.prevent="submitForm" lazy-validation>
		<v-text-field
			v-model.trim="formState.email"
			:rules="validations.email"
			label="Email"
			placeholder="Enter email"
			class="mt-5"
			variant="underlined"
			clearable
			autocomplete="on"
			required />

		<pass-field v-model.trim="formState.password" class="mt-5" />

		<v-btn type="submit" color="success" v-bind="{ loading }" class="btn mt-6"> Sign In </v-btn>
	</v-form>
</template>

<script setup lang="ts">
import PassField from '@/components/UI/PassField.vue';
import validations from '@/utils/validations';
import { ref } from 'vue';
import { AuthService } from '@/services/auth';
import type { VForm } from 'vuetify/components';
import type { User } from 'firebase/auth';

const emit = defineEmits<{
	success: [user?: User];
	error: [err: unknown];
}>();

const formEl = ref<VForm | null>(null);
const loading = ref(false);
const formState = ref({
	email: '',
	password: '',
});

const submitForm = async () => {
	const valid = (await formEl.value?.validate())?.valid;
	if (valid) {
		try {
			loading.value = true;
			const user = await AuthService.loginWithEmail(formState.value);
			emit('success', user);
		} catch (e) {
			emit('error', e);
		} finally {
			loading.value = false;
		}
	}
};
</script>

<style lang="scss" scoped>
.btn {
	position: relative;
	left: 100%;
	transform: translate(-120%);
}
</style>
