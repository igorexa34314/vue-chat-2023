<template>
	<v-dialog width="auto" persistent v-model="dialog">
		<v-card width="600px">
			<v-card-title class="d-flex align-center mt-2">
				<v-btn icon="mdi-close" variant="text" @click="closeDialog" />
				<h3 class="text-center flex-grow-1">Отправить фото</h3>
			</v-card-title>
			<v-card-text>
				<v-form @submit.prevent="submitHandler">
					<v-card class="image-wrapper" max-width="400px" max-height="400px">
						<v-img :src="previewSrc || defaultAvatar" alt="My image" cover />
					</v-card>
					<div class="d-flex align-center mt-6 mb-3">
						<v-text-field v-model="formState.subtitle" variant="solo" label="Добавить подпись" class="mr-4"
							hide-details />
						<v-btn type="submit" color="purple-darken-4" size="large" rounded>Отправить</v-btn>
					</div>
				</v-form>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { reactive, computed } from "vue";

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;

const props = defineProps(['previewSrc', 'modelValue']);
const emit = defineEmits(['update:modelValue', 'submit', 'close']);
const dialog = computed({
	get: () => props.modelValue,
	set: value => emit('update:modelValue', value),
});
const submitHandler = () => {
	emit('submit', formState);
	emit('update:modelValue', false);
};
const closeDialog = () => {
	emit('close');
	emit('update:modelValue', false);
};
const formState = reactive({
	subtitle: ''
});
</script>

<style lang="scss" scoped>
.image-wrapper {
	margin: 0 auto;
	@media(max-width: 760px) {
		max-width: 300px;
	}
}
</style>