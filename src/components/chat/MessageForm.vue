<template>
	<div>
		<div class="message-form d-flex flex-row align-center">
			<v-text-field v-model.trim="messageState.text" variant="solo" hide-details @keyup.enter="createTextMessage"
				placeholder="Ваше сообщение">
				<template #append-inner>
					<AttachMenu @attach-media="attachMedia" @attach-file="attachFile" />
				</template>
			</v-text-field>
			<v-btn icon="mdi-send" label="Отправить" class="ml-3" @click="createTextMessage"></v-btn>
		</div>
		<AttachDialog v-model="attachDialogState.show" :content="attachDialogState.previewContent" @submit="createAttachment"
			@close="closeDialog" />
	</div>
</template>

<script setup>
import AttachMenu from '@/components/chat/AttachMenu.vue';
import AttachDialog from '@/components/chat/AttachDialog.vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { ref, reactive } from 'vue';

const { showMessage } = useSnackbarStore();
const emit = defineEmits(['submitForm']);

const attachDialogState = reactive({
	show: false,
	previewContent: {
		type: '',
		data: null,
	}
});
const file = ref();
const messageState = reactive({
	text: '',
});

const createTextMessage = () => {
	if (messageState.text) {
		emit('submitForm', {
			text: messageState.text
		}, 'text');
		messageState.text = '';
	}
};
const createAttachment = (type, content) => {
	if (type === 'image') {
		const { subtitle, image } = content;
		emit('submitForm', {
			subtitle,
			image: {
				data: file.value,
				...image,
			},
		}, 'media');
	} else if (type === 'file') {
		emit('submitForm', {
			subtitle: content.subtitle,
			file: file.value,
		}, 'file');
	}
};
const attachMedia = e => {
	const files = e.target.files || e.dataTransfer.files;
	if (!files.length)
		return;
	if (files.length && files[0].type.startsWith('image/')) {
		attachDialogState.previewContent.type = 'image';
		file.value = files[0];
		if (file.value.size > 4194304) {
			showMessage('Допустимый размер файла - до 4 Мбайт', 'red-darken-3', 2500);
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			attachDialogState.previewContent.data = {
				fullname: file.value.name, size: file.value.size,
				ext: file.value.name.split('.')[file.value.name.split('.').length - 1],
				src: reader.result
			}
		}
		reader.onerror = e => console.error(e);
		reader.readAsDataURL(file.value);
		e.target.value = '';
		attachDialogState.show = true;
	};
};
const attachFile = e => {
	const files = e.target.files || e.dataTransfer.files;
	if (!files.length)
		return;
	file.value = files[0];
	e.target.value = '';
	attachDialogState.previewContent.type = 'file';
	attachDialogState.previewContent.data = {
		name: file.value.name, size: file.value.size,
		ext: file.value.name.split('.')[file.value.name.split('.').length - 1],
	};
	attachDialogState.show = true;
};
const closeDialog = () => {
	file.value = null;
	attachDialogState.previewContent.data = null;
	attachDialogState.previewContent.type = '';
};
</script>

<style lang="scss" scoped></style>