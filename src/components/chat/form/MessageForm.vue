<template>
	<div>
		<div class="message-form d-flex flex-row align-end">
			<v-textarea v-model.trim="messageState.text" variant="solo" hide-details @keyup.enter="createTextMessage"
				placeholder="Ваше сообщение" rows="1" max-rows="12" auto-grow focused>
				<template #append-inner>
					<AttachMenu @attach-file="attachFile">
						<template #activator="{ props }">
							<div class="attach-btn ml-4">
								<v-icon v-bind="props" icon="mdi-attachment mdi-rotate-135" size="large" class="attach-icon"
									v-ripple />
							</div>
						</template>
					</AttachMenu>
				</template>
			</v-textarea>
			<v-btn icon="mdi-send" label="Отправить" class="ml-3 mb-1" @click="createTextMessage" />
		</div>
		<AttachDialog v-model="attachDialogState.show" :contentType="attachDialogState.contentType"
			:fileList="messageState.attachedFiles" @submit="createAttachment" @close="closeDialog" />
	</div>
</template>

<script setup lang="ts">
import AttachMenu from '@/components/chat/form/attach/AttachMenu.vue';
import AttachDialog from '@/components/chat/form/attach/AttachDialog.vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { reactive } from 'vue';
import { uuidv4 } from '@firebase/util';
import type { AttachFormContent } from '@/stores/messages';
import type { Message, TextMessage, } from '@/types/db/MessagesTable';
import type { AttachDialogProps } from '@/components/chat/form/attach/AttachDialog.vue';

interface messageForm extends TextMessage {
	attachedFiles: AttachDialogProps['fileList']
};

const { showMessage } = useSnackbarStore();
const emit = defineEmits<{
	(e: 'submitForm', msgData: TextMessage | AttachFormContent, msgType: Message['type']): void
}>();
const messageState: messageForm = reactive({
	text: '',
	attachedFiles: [] as AttachDialogProps['fileList'],
});
const attachDialogState = reactive({
	show: false as AttachDialogProps['modelValue'],
	contentType: 'file' as AttachDialogProps['contentType'],
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
	messageState.attachedFiles = [];
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
	messageState.attachedFiles = files.map(f => ({ id: uuidv4(), fileData: f }));
	attachDialogState.show = true;
};
const closeDialog = () => {
	messageState.attachedFiles = [];
};
</script>

<style lang="scss" scoped>
.attach-btn {
	position: relative;
	opacity: 0.65;
	width: 40px;
	height: 100%;
	display: flex;
	align-items: flex-end;
	justify-content: flex-end;
}
.attach-icon {
	padding: 0.7em;
	right: 4px;
	transform: translateY(-20%);
	bottom: 0;
	border-radius: 50%;
}
</style>