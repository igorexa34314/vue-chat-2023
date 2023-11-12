<template>
	<v-btn @click="signInWithGoogleProvider" flat type="button" density="compact" stacked variant="plain">
		<v-img :src="googleLogo" eager width="36px" alt="Sign up with Google" />
	</v-btn>
</template>

<script setup lang="ts">
import { googleLogo } from '@/global-vars';
import { AuthService } from '@/services/auth';
import type { User } from 'firebase/auth';

const emit = defineEmits<{
	success: [user?: User];
	error: [err: unknown];
}>();

const signInWithGoogleProvider = async () => {
	try {
		const user = await AuthService.signInWithGoogle();
		emit('success', user);
	} catch (err) {
		console.error(err);
		emit('error', err);
	}
};
</script>
