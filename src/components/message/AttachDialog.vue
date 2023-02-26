<template>
	<v-dialog width="auto" persistent v-model="dialog" class="attach-dialog">
		<v-card width="600px" variant="flat" elevation="3">
			<v-card-title class="d-flex align-center mt-2">
				<v-btn icon="mdi-close" variant="text" @click="closeDialog" />
				<h3 class="text-center flex-grow-1">{{ contentType === 'media' ? 'Отправить фото' : 'Отправить файл' }}</h3>
			</v-card-title>
			<v-card-text>
				<v-form @submit.prevent="submitHandler">
					<v-card v-if="contentType === 'media'" class="image-wrapper" max-width="400px" max-height="400px">
						<v-img :src="previewContent" alt="My image" cover />
					</v-card>
					<div v-else-if="previewContent.name && previewContent.size" class="d-flex align-center">
						<div class="file-icon">
							<v-icon icon="mdi-file" size="100px" />
							<span class="file-icon-ext font-weight-black text-brown-darken-4">
								{{ previewContent.name.split('.')[previewContent.name.split('.').length - 1] }}</span>
						</div>
						<div class="ml-2 text-subtitle-1 font-weight-medium">
							<p class="text-subtitle-1">{{ previewContent.name }}</p>
							<p class="mt-1 text-body-2">{{ previewContent.size < 1024 ? previewContent.size + ' bytes' :
								previewContent.size < 1048576 ? (previewContent.size / 1024).toPrecision(4) + ' KB' :
									(previewContent.size / 1048576).toPrecision(4) + ' MB' }}</p>
						</div>
					</div>
					<div class="d-flex align-center mt-6 mb-3 px-4">
						<v-text-field v-model="formState.subtitle" variant="plain" placeholder="Добавить подпись" class="mr-4"
							hide-details autofocus style="transform: translateY(-11px);" />
						<v-btn type="submit" color="purple-lighten-1" size="large" rounded>Отправить</v-btn>
					</div>
				</v-form>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { reactive, computed, inject } from "vue";

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;

const previewContent = inject('previewContent');
const props = defineProps(['modelValue', 'contentType']);
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
.attach-dialog :deep(.v-overlay__scrim) {
	background: #000000;
	opacity: 55%;
}
.image-wrapper {
	margin: 0 auto;
	@media(max-width: 760px) {
		max-width: 300px;
	}
}
.file-icon {
	position: relative;
	&-ext {
		font-size: 1.1rem;
		display: inline-block;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -30%);
	}
}
</style>