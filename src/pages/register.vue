<template>
	<v-layout>
		<v-main>
			<v-container
				class="d-flex flex-column align-center justify-center"
				style="min-height: 100dvh; min-height: 100vh">
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
						<div class="mt-4 text-center">
							Have an account? <router-link to="/login">Sign In</router-link>
						</div>
					</v-card-actions>
				</v-card>
			</v-container>
		</v-main>
	</v-layout>
</template>

<script setup lang="ts">
import GoogleProvider from '@/components/auth/providers/GoogleProvider.vue';
import LocalRegister from '@/components/auth/LocalRegister.vue';
import messages from '@/utils/messages.json';
import { useHead } from '@unhead/vue';
import { useRouter, useRoute } from 'vue-router';
import { useSnackbarStore } from '@/stores/snackbar';
import { useDisplay } from 'vuetify';
import type { User } from 'firebase/auth';

useHead({ title: 'Register' });

const { xs } = useDisplay();
const route = useRoute();
const router = useRouter();
const { showMessage } = useSnackbarStore();
const msg = route.query.message as keyof typeof messages;

if (msg && messages[msg]) {
	showMessage(messages[msg]);
}

const onRegisterSuccess = async (user?: User) => {
	if (user?.providerId === 'firebase')
		router.push({
			name: '/enter-name',
			query: { tokenId: (await user.getIdTokenResult()).claims.sub },
		});
	else {
		showMessage('sign_in_success');
		router.push('/profile');
	}
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
