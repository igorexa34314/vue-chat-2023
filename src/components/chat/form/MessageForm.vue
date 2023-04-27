<template>
	<div>
		<div class="message-form d-flex flex-row align-end">
			<div class="message-textarea">
				<Transition name="reply">
					<MessageReply v-model="showReply" :content="messageState.text" class="reply-wrapper" />
				</Transition>
				<v-textarea v-model.trim="inputCompVal" variant="solo" hide-details @keyup.enter="createTextMessage"
					placeholder="Ваше сообщение" rows="1" max-rows="12" auto-grow focused @paste="onInputPasted">
					<template #append-inner>
						<AttachMenu ref="attachMenuEl" @attach-file="attachFiles">
							<template #activator="{ props }">
								<div class="attach-btn ml-4">
									<v-icon v-bind="props" :icon="mdiAttachment" size="large" class="attach-icon"
										v-ripple="false" />
								</div>
							</template>
						</AttachMenu>
					</template>
				</v-textarea>
			</div>
			<v-btn :icon="isEditing ? mdiCheck : mdiSend" :label="isEditing ? 'Подтвердить' : 'Отправить'" class="ml-3 mb-1"
				@click="submitHandler" />
		</div>
		<AttachDialog v-model="attachDialogState.show" v-model:subtitleText="messageState.text"
			:contentType="attachDialogState.contentType" :fileList="messageState.attachedFiles" @submit="createAttachment"
			@close="closeDialog" @add-more-files="attachFiles" @change-content-type="changeContentType" />
	</div>
</template>

<script setup lang="ts">
import { mdiAttachment, mdiSend, mdiCheck, mdiPencil, mdiClose } from '@mdi/js';
import MessageReply from './MessageReply.vue';
import AttachMenu from '@/components/chat/form/attach/AttachMenu.vue';
import AttachDialog from '@/components/chat/form/attach/AttachDialog.vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { ref, reactive, computed } from 'vue';
import { uuidv4 } from '@firebase/util';
import type { AttachFormContent } from '@/services/message';
import type { Message, TextMessage, MediaMessage, FileMessage } from '@/types/db/MessagesTable';
import type { AttachDialogProps, AttachedContent } from '@/components/chat/form/attach/AttachDialog.vue';

interface messageForm extends TextMessage {
	attachedFiles: AttachDialogProps['fileList']
};

const { showMessage } = useSnackbarStore();
const emit = defineEmits<{
	(e: 'createMessage', msgData: TextMessage | AttachFormContent, msgType: Message['type']): void
	(e: 'updateMessage', mId: Message['id'], msgData: TextMessage | AttachFormContent, msgType: Message['type']): void
}>();
const messageState: messageForm = reactive({
	text: '' as TextMessage['text'] | MediaMessage['subtitle'] | FileMessage['subtitle'],
	attachedFiles: [] as AttachDialogProps['fileList'],
});

const attachDialogState = reactive({
	show: false as AttachDialogProps['modelValue'],
	contentType: 'file' as AttachDialogProps['contentType'],
});

const inputCompVal = computed({
	get: () => !attachDialogState.show ? messageState.text : '',
	set: (val: string) => messageState.text = val,
});
const submitHandler = () => {
	if (isEditing.value) {
		updateMessage();
	}
	else {
		createTextMessage();
	}
}
const createTextMessage = () => {
	if (messageState.text) {
		emit('createMessage', {
			text: messageState.text
		} as TextMessage, 'text');
		messageState.text = '';
	}
};
const createAttachment = (type: AttachDialogProps['contentType'], attachData: AttachedContent) => {
	emit('createMessage', {
		subtitle: messageState.text,
		files: attachData
	} as AttachFormContent, type);
	messageState.text = '';
	messageState.attachedFiles = [];
};

const attachFiles = async (type: Exclude<Message['type'], 'text'>, fileList: FileList, subtitleText?: string) => {
	if (!fileList?.length)
		return;
	if (fileList.length > 10 || messageState.attachedFiles.length > 10) {
		showMessage('Нельзя отправлять более 10 файлов в одном сообщении', 'red-darken-3', 2500);
		return;
	}
	let files: File[] = [];
	for (let i = 0; i < fileList.length; i++) {
		files.push(fileList.item(i) as File);
	}
	if (type === 'media' && files.length) {
		files = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
		attachDialogState.contentType = 'media';
	}
	else if (type === 'file') attachDialogState.contentType = 'file';
	messageState.attachedFiles = files.map(f => ({ id: uuidv4(), fileData: f }));
	attachDialogState.show = true;
};
const changeContentType = () => {
	if (attachDialogState.contentType === 'media') {
		attachDialogState.contentType = 'file';
	}
	else if (attachDialogState.contentType === 'file' && messageState.attachedFiles.every(({ fileData }) => fileData.type.startsWith('image/'))) {
		attachDialogState.contentType = 'media';
	}
};
const onInputPasted = (e: ClipboardEvent) => {
	if (e.clipboardData?.types.includes('Files')) {
		const attachedFiles = e.clipboardData.files;
		attachFiles('media', attachedFiles, messageState.text);
	}
};
const isEditing = ref(false);
const editMessage = (mId: Message['id'], mType: Message['type'], content: Message['content']) => {
	isEditing.value = true;
	msgId.value = mId;
	if (mType === 'text') {
		messageState.text = (content as TextMessage).text;
	}
	else {
		messageState.text = (content as MediaMessage | FileMessage).subtitle;
	}
};
const msgId = ref<Message['id']>('');
const updateMessage = () => {
	if (messageState.text && msgId.value) {
		emit('updateMessage', msgId.value, {
			text: messageState.text
		} as TextMessage, 'text');
		isEditing.value = false;
		messageState.text = '';
	}
};
const showReply = computed({
	get: () => isEditing.value,
	set: (val: boolean) => isEditing.value = val,
});
const closeDialog = () => {
	messageState.attachedFiles = [];
};
defineExpose({
	editMessage
});
</script>

<style lang="scss" scoped>
.message-textarea {
	position: relative;
	flex: 1 1 auto;
}
.reply-wrapper {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	transform: translateY(-95%);
	z-index: 50;
}
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
	transform: rotate(135deg) translate(-20%, 50%);
}
.reply-enter-active,
.reply-leave-active {
	transition: all 0.3s ease;
}

.reply-enter-from,
.reply-leave-to {
	opacity: 0;
}
</style>