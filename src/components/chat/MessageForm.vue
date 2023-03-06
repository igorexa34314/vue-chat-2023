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
import { reactive } from 'vue';

const { showMessage } = useSnackbarStore();
const emit = defineEmits(['submitForm']);

const messageState = reactive({
	text: '',
	attachedFiles: [],
});
const attachDialogState = reactive({
	show: false,
	previewContent: {
		type: '',
		data: [],
	}
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
const readFilesAsURL = (file) => {
	return new Promise((res, rej) => {
		const reader = new FileReader();
		reader.onload = () => res({ file, res: reader.result });
		reader.onerror = () => rej(reader);
		reader.readAsDataURL(file);
	});
};
const attachMedia = async (e) => {
	const files = e.target.files || e.dataTransfer.files;
	if (!files.length)
		return;
	if (files.length > 10) {
		showMessage('Нельзя отправлять более 10 файлов в одном сообщении', 'red-darken-3', 2500);
		return;
	}
	if (files.length && [...files].every(f => f.type.startsWith('image/'))) {
		attachDialogState.previewContent.type = 'image';
		messageState.attachedFiles = files;
		const promises = [];
		for (const f of messageState.attachedFiles) {
			if (f.size > 3145728) {
				showMessage('Допустимый размер файлов - до 3 Мбайт', 'red-darken-3', 2500);
				return;
			}
			promises.push(readFilesAsURL(f));
		}
		try {
			(await Promise.all(promises)).forEach(el => {
				attachDialogState.previewContent.data.push({
					fullname: el.file.name, size: el.file.size,
					ext: el.file.name.split('.')[el.file.name.split('.').length - 1],
					src: el.res
				});
			})
		} catch (e) {
			console.error(e);
		}
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
	attachDialogState.files = [];
	attachDialogState.previewContent.data = [];
	attachDialogState.previewContent.type = '';
};
</script>

<style lang="scss" scoped></style>