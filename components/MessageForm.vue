<template>
	<div class="d-flex flex-row align-center">
		<v-text-field v-model="text" variant="solo" hide-details @keyup.enter="createMessage"></v-text-field>
		<v-btn icon="mdi-send" label="Отправить" class="ml-3" @click="createMessage"></v-btn>
	</div>
</template>

<script>
export default {
	name: 'message-form',
	setup(props, { emit }) {
		const text = ref('');

		const createMessage = () => {
			if (text.value) {
				emit('submitForm', text.value);
				text.value = '';
			}
		}
		return {
			text, createMessage
		}
	}
}
</script>

<style lang="scss" scoped>

</style>