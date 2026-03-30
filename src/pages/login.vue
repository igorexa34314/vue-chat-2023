<template>
	<v-layout>
		<v-main>
			<v-container
				class="d-flex flex-column align-center justify-center"
				style="min-height: 100dvh; min-height: 100vh">
				<v-card width="100%" :max-width="xs ? 400 : 450" variant="tonal" class="pa-2">
					<v-card-item class="mb-3">
						<v-card-title class="text-center">Login to chat</v-card-title>
					</v-card-item>

					<v-card-text class="mt-3">
						<LocalLogin @success="onLoginSuccess" @error="onLoginError" />
					</v-card-text>

					<v-card-actions class="flex-column justify-center">
						<div class="providers d-flex">
							<GoogleProvider @error="onLoginError" />
						</div>
						<div class="text-center mt-4">
							Dont have an account? <router-link to="/register">Register</router-link>
						</div>
					</v-card-actions>
				</v-card>
			</v-container>
		</v-main>
	</v-layout>
</template>

<script setup lang="ts">
import LocalLogin from '@/components/auth/LocalLogin.vue';
import GoogleProvider from '@/components/auth/providers/GoogleProvider.vue';
import messages from '@/utils/messages.json';
import { useHead } from '@unhead/vue';
import { useRouter, useRoute } from 'vue-router';
import { useSnackbarStore } from '@/stores/snackbar';
import { useDisplay } from 'vuetify';

useHead({ title: 'Login' });

const route = useRoute();
const msg = route.query.message as keyof typeof messages;

const { xs } = useDisplay();
const router = useRouter();
const { showMessage } = useSnackbarStore();

if (msg && messages[msg]) {
	showMessage(messages[msg]);
}

const onLoginSuccess = () => {
	showMessage('login_success');
	router.push('/profile');
};
const onLoginError = (e: unknown) => {
	showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
	// showMessage(te(`firebase.messages.${e}`) ? t(`firebase.messages.${e}`) : t('login_error'));
};
</script>
