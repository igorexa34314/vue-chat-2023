<template>
	<v-layout>
		<v-main>
			<RouterView />
		</v-main>
</v-layout>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { useSnackbarStore } from '@/stores/snackbar';
import messages from '@/utils/messages';

const route = useRoute();
const snackbar = useSnackbarStore();

if (messages[route.query.message]) {
	snackbar.showMessage(messages[route.query.message]);
}
</script>

<style lang="scss" scoped></style>