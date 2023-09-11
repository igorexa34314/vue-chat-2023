<template>
	<v-container class="d-flex flex-column align-center justify-center" style="min-height: 100dvh; min-height: 100vh">
		<v-card width="100%" :max-width="xs ? 400 : 450" variant="tonal" class="pa-2">
			<v-card-item class="mb-3">
				<v-card-title class="text-center">Register</v-card-title>
			</v-card-item>

			<v-card-text class="mt-3">
				<LocalRegister @success="onRegisterSuccess" @error="onRegisterError" />
			</v-card-text>

			<v-card-actions class="flex-column justify-center">
				<div class="providers d-flex">
					<GoogleProvider @success="onRegisterSuccess" @error="onRegisterError" />
				</div>
				<div class="mt-4 text-center">Have an account? <router-link to="/login">Sign In</router-link></div>
			</v-card-actions>
		</v-card>
	</v-container>
</template>

<script setup lang="ts">
import GoogleProvider from '@/components/auth/providers/GoogleProvider.vue';
import LocalRegister from '@/components/auth/LocalRegister.vue';
import messages from '@/utils/messages.json';
import { VContainer } from 'vuetify/components';
import { useMeta } from 'vue-meta';
import { definePage } from 'vue-router/auto';
import { useRouter } from 'vue-router/auto';
import { useSnackbarStore } from '@/stores/snackbar';
import { useDisplay } from 'vuetify';

definePage({ meta: { layout: 'empty' } });
useMeta({ title: 'Register' });

const { xs } = useDisplay();
const { push } = useRouter();
const { showMessage } = useSnackbarStore();

const onRegisterSuccess = async () => {
	showMessage('sign_in_success');
	push('/profile');
};
const onRegisterError = async (e: unknown) => {
	showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
	// if (typeof e === 'string') {
	// 	showMessage(te(`firebase.messages.${e}`) ? t(`firebase.messages.${e}`) : e, 'red-darken-3');
	// } else {
	// 	showMessage(t('error_register'), 'red-darken-3');
	// }
};
</script>
