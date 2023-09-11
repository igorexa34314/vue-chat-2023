<template>
	<v-btn @click="signInWithGoogleProvider" flat type="button" density="compact" stacked variant="plain">
		<v-img :src="googleLogo" eager width="36px" alt="Sign up with Google" />
	</v-btn>
</template>

<script setup lang="ts">
import { googleLogo } from '@/global-vars';
import { AuthService } from '@/services/auth';

const emit = defineEmits<{
	success: [];
	error: [err: unknown];
}>();

const signInWithGoogleProvider = () => {
	AuthService.signInWithGoogle()
		.then(() => emit('success'))
		.catch(e => {
			console.error(e);
			emit('error', e);
		});
};
</script>
