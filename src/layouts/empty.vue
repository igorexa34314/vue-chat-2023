<template>
	<v-layout>
		<v-main>
			<RouterView />
		</v-main>
	</v-layout>
</template>

<script setup lang="ts">
import messages from '@/utils/messages.json';
import { useRoute } from 'vue-router';
import { useSnackbarStore } from '@/stores/snackbar';

const route = useRoute();
const { showMessage } = useSnackbarStore();
const msg = route.query.message as keyof typeof messages;

showMessage(messages[msg] || msg);
</script>

<style lang="scss" scoped></style>