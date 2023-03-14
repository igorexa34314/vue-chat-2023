<template>
	<div>
		<div class="message-form d-flex flex-row align-center">
			<v-text-field v-model.trim="messageState.text" variant="solo" hide-details @keyup.enter="createTextMessage"
				placeholder="Ваше сообщение">
				<template #append-inner>
					<AttachMenu @attach-media="attachMedia" @attach-file="attachFile" />
				</template>
			</v-text-field>
			<v-btn icon="mdi-send" label="Отправить" class="ml-3" @click="createTextMessage" />
		</div>
		<AttachDialog v-model="attachDialogState.show" :content="attachDialogState.previewContent" @submit="createAttachment"
			@close="closeDialog" />
	</div>
</template>

<script setup lang="ts">
import AttachMenu from '@/components/chat/AttachMenu.vue';
import AttachDialog from '@/components/chat/AttachDialog.vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { reactive } from 'vue';
import { uuidv4 } from '@firebase/util';
import type { Message, TextMessage, MediaMessage, FileMessage } from '@/types/db/MessagesTable';
import type { AttachedContent } from '@/components/chat/AttachDialog.vue';

interface AttachedDialog {
	show: boolean;
	previewContent: AttachedContent;
}

interface messageForm extends TextMessage {
	attachedFiles?: MediaMessage[] | FileMessage[]
}

const { showMessage } = useSnackbarStore();
const emit = defineEmits<{
	(e: 'submitForm', msgData: Message['content'], msgType: Message['type']): void
}>();
const messageState: messageForm = reactive({
	text: '',
	attachedFiles: [],
});
const attachDialogState: AttachedDialog = reactive({
	show: false,
	previewContent: {
		type: 'file',
		files: [],
	}
});

const createTextMessage = () => {
	if (messageState.text) {
		emit('submitForm', {
			text: messageState.text
		} as TextMessage, 'text');
		messageState.text = '';
	}
};
const createAttachment = (type: AttachedContent['type'], content: Message['content']) => {
	emit('submitForm', content, type === 'image' || type === 'video' ? 'media' : type);
};
const attachMedia = async (e: Event) => {
	const fileList = (<HTMLInputElement>e.target).files;
	if (!fileList?.length)
		return;
	if (fileList.length > 10) {
		showMessage('Нельзя отправлять более 10 файлов в одном сообщении', 'red-darken-3', 2500);
		return;
	}
	const files: File[] = [];
	for (let i = 0; i < files.length; i++) {
		files.push(fileList.item(i) as File);
	}
	if (files.length && files.every(f => f.type.startsWith('image/'))) {
		attachDialogState.previewContent.type = 'image';
		attachDialogState.previewContent.files = files.map(f => ({ id: uuidv4(), data: f }));
	}
	attachDialogState.show = true;
};
const attachFile = (e: Event) => {
	// const files = e.target.files || e.dataTransfer.files;
	// if (!files.length)
	// 	return;
	// file.value = files[0];
	// e.target.value = '';
	// attachDialogState.previewContent.type = 'file';
	// attachDialogState.previewContent.data = {
	// 	name: file.value.name, size: file.value.size,
	// 	ext: file.value.name.split('.')[file.value.name.split('.').length - 1],
	// };
	// attachDialogState.show = true;
};
const closeDialog = () => {
	messageState.attachedFiles = [];
	attachDialogState.previewContent.files = [];
	attachDialogState.previewContent.type = 'file';
};
</script>

<style lang="scss" scoped></style>