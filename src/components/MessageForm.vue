<template>
	<div>
		<v-form @submit.prevent class="d-flex flex-row align-center">
			<v-text-field v-model.trim="messageState.text" variant="solo" hide-details @keyup.enter="createMessage"
				placeholder="Ваше сообщение" density="comfortable" />
			<v-btn icon="mdi-send" label="Отправить" class="ml-3" @click="createMessage"></v-btn>
		</v-form>
	</div>
</template>

<script setup>
import { reactive } from 'vue';

const emit = defineEmits(['submitForm'])

const messageState = reactive({
	text: '',
});

const createMessage = () => {
	if (messageState.text) {
		emit('submitForm', messageState.text);
		messageState.text = '';
	}
}
</script>

<style lang="scss" scoped></style>