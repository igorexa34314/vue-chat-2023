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
		<AttachDialog v-model="dialog" @submit="createAttachment" @close="closeDialog" />
	</div>
</template>

<script setup>
import AttachMenu from '@/components/message/AttachMenu.vue';
import AttachDialog from '@/components/message/AttachDialog.vue';
import { ref, reactive, provide } from 'vue';

const emit = defineEmits(['submitForm']);

const dialog = ref(false);
const previewContent = reactive({
	type: '',
	name: '',
	size: '',
	imageSrc: '',
});
provide('previewContent', previewContent);
const file = ref();
const fileType = ref('media');
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
const createAttachment = content => {
	emit('submitForm', {
		...content,
		image: file.value || null,
	}, 'media');
};
const attachMedia = e => {
	const files = e.target.files || e.dataTransfer.files;
	if (!files.length)
		return;
	file.value = files[0];
	const reader = new FileReader();
	reader.onload = () => previewContent.value = reader.result;
	reader.onerror = e => console.error(e);
	reader.readAsDataURL(file.value);
	e.target.value = '';
	fileType.value = 'media';
	dialog.value = true;
};
const attachFile = e => {
	const files = e.target.files || e.dataTransfer.files;
	if (!files.length)
		return;
	file.value = files[0];
	e.target.value = '';
	previewContent.type = 'file';
	previewContent.name = file.value.name;
	previewContent.size = file.value.size;
	dialog.value = true;
};
const closeDialog = () => {
	file.value = null;
	previewContent.value = null;
};
</script>

<style lang="scss" scoped></style>