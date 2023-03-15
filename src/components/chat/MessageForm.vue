<template>
	<div>
		<div class="message-form d-flex flex-row align-center">
			<v-text-field v-model.trim="messageState.text" variant="solo" hide-details @keyup.enter="createTextMessage"
				placeholder="Ваше сообщение">
				<template #append-inner>
					<AttachMenu @attach-file="attachFile" />
				</template>
			</v-text-field>
			<v-btn icon="mdi-send" label="Отправить" class="ml-3" @click="createTextMessage" />
		</div>
		<AttachDialog v-model="attachDialogState.show" :contentType="attachDialogState.contentType"
			:fileList="attachDialogState.fileList" @submit="createAttachment" @close="closeDialog" />
	</div>
</template>

<script setup lang="ts">
import AttachMenu from '@/components/chat/AttachMenu.vue';
import AttachDialog from '@/components/chat/AttachDialog.vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { reactive } from 'vue';
import { uuidv4 } from '@firebase/util';
import type { AttachFormContent } from '@/stores/messages';
import type { Message, TextMessage, MediaMessage, FileMessage } from '@/types/db/MessagesTable';
import type { AttachDialogProps } from '@/components/chat/AttachDialog.vue';


interface messageForm extends TextMessage {
	attachedFiles?: MediaMessage[] | FileMessage[]
}

const { showMessage } = useSnackbarStore();
const emit = defineEmits<{
	(e: 'submitForm', msgData: TextMessage | AttachFormContent, msgType: Message['type']): void
}>();
const messageState: messageForm = reactive({
	text: '',
	attachedFiles: [],
});
const attachDialogState = reactive({
	show: false as AttachDialogProps['modelValue'],
	contentType: 'file' as AttachDialogProps['contentType'],
	fileList: [] as AttachDialogProps['fileList'],
});

const createTextMessage = () => {
	if (messageState.text) {
		emit('submitForm', {
			text: messageState.text
		} as TextMessage, 'text');
		messageState.text = '';
	}
};
const createAttachment = (type: AttachDialogProps['contentType'], content: TextMessage | AttachFormContent) => {
	emit('submitForm', content, type === 'image' || type === 'video' ? 'media' : type);
};

const attachFile = async (type: Exclude<Message['type'], 'text'>, e: Event) => {
	const fileList = (<HTMLInputElement>e.target).files;
	if (!fileList?.length)
		return;
	if (fileList.length > 10) {
		showMessage('Нельзя отправлять более 10 файлов в одном сообщении', 'red-darken-3', 2500);
		return;
	}
	const files: File[] = [];
	for (let i = 0; i < fileList.length; i++) {
		files.push(fileList.item(i) as File);
	}
	if (type === 'media' && files.length && files.every(f => f.type.startsWith('image/'))) {
		attachDialogState.contentType = 'image';
	}
	else if (type === 'file') attachDialogState.contentType = 'file';
	attachDialogState.fileList = files.map(f => ({ id: uuidv4(), fileData: f }));
	attachDialogState.show = true;
};
const closeDialog = () => {
	messageState.attachedFiles = [];
	attachDialogState.fileList = [];
};
</script>

<style lang="scss" scoped></style>