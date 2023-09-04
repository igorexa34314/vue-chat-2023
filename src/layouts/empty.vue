<template>
	<v-layout>
		<v-main>
			<RouterView />
		</v-main>
	</v-layout>
</template>

<script setup lang="ts">
import { VLayout, VMain } from 'vuetify/components';
import messages from '@/utils/messages.json';
import { useRoute } from 'vue-router/auto';
import { useSnackbarStore } from '@/stores/snackbar';

const route = useRoute();
const { showMessage } = useSnackbarStore();
const msg = route.query.message as keyof typeof messages;

if (msg && messages[msg]) {
	showMessage(messages[msg]);
}
</script>
