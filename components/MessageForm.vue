<template>
	<div class="py-3 px-3">
		<v-form @submit.prevent class="d-flex flex-row align-center">
			<v-text-field v-model="text" variant="solo" hide-details @keyup.enter="createMessage"
				placeholder="Ваше сообщение" density="comfortable" />
			<v-btn icon="mdi-send" label="Отправить" class="ml-3" @click="createMessage"></v-btn>
		</v-form>
	</div>
</template>

<script setup>
const emit = defineEmits(['submitForm'])

const text = ref('');

const createMessage = () => {
	if (text.value) {
		emit('submitForm', text.value);
		text.value = '';
	}
}
</script>

<style lang="scss" scoped>

</style>