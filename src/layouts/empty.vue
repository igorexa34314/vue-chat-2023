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

if (messages[route.query.message]) {
	showMessage(messages[route.query.message]);
}
</script>

<style lang="scss" scoped></style>