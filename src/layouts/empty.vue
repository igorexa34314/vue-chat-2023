<template>
	<v-layout>
		<v-main>
			<RouterView />
		</v-main>
	</v-layout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useSnackbarStore } from '@/stores/snackbar';
import messages from '@/utils/messages.json';

const route = useRoute();
const { showMessage } = useSnackbarStore();
const msg = route.query.message as string;

if (messages[msg]) {
	showMessage(messages[msg]);
}
</script>

<style lang="scss" scoped></style>