<template>
	<div class="message-form d-flex flex-row align-end" v-bind="$attrs">
		<div class="message-textarea">
			<MessageReply v-model="showReply" :m-type="msgToEditState.type" :content="msgToEditState.content"
				class="reply-wrapper" @go-to-message="emit('scrollToMessage', msgToEditState.id)" />
			
				<v-textarea v-model.trim="textareaValue" variant="solo" hide-details @keyup.enter="createMessage('text')"
				placeholder="Your message" rows="1" max-rows="10" auto-grow focused @paste="onInputPasted" #append-inner>
				<AttachMenu ref="attachMenuEl" @attach-file="attachFiles" #activator="{ props }">
					<div class="attach-btn ml-4">
						<v-icon v-bind="props" :icon="mdiAttachment" size="large" class="attach-icon" v-ripple="false" />
					</div>
				</AttachMenu>
			</v-textarea>
		</div>

		<v-btn :icon="msgToEditState.isEditing ? mdiCheck : mdiSend" :label="msgToEditState.isEditing ? 'Submit' : 'Send'"
			class="ml-3 mb-1" @click="submitHandler" />
	</div>
	
	<AttachDialog v-model="attachDialogState.show" v-model:subtitleText="messageState.text"
		:contentType="attachDialogState.contentType" :fileList="messageState.attachedFiles" @submit="createMessage"
		@close="closeDialog" @add-more-files="attachFiles" @change-content-type="changeContentType" />
</template>

<script setup lang="ts">
import { mdiAttachment, mdiSend, mdiCheck } from '@mdi/js';
import MessageReply from './MessageReply.vue';
import AttachMenu from '@/components/chat/attach/AttachMenu.vue';
import AttachDialog, { AttachDialogProps, AttachedContent } from '@/components/chat/attach/AttachDialog.vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { ref, computed, watchEffect } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { AttachFormContent } from '@/services/message';
import { Message } from '@/stores/messages';
import { MessageContent } from '@/types/db/MessagesTable';

export type EditMessageData = Pick<Message, 'id' | 'type' | Partial<'content'>>;
interface MessageForm extends Omit<MessageContent, 'attachments'> {
	attachedFiles: AttachDialogProps['fileList']
};

const emit = defineEmits<{
	createMessage: [msgType: Message['type'], msgContent: Partial<AttachFormContent>],
	updateMessage: [mData: EditMessageData],
	scrollToMessage: [mId: Message['id']],
}>();

defineOptions({
	inheritAttrs: false,
});

const { showMessage } = useSnackbarStore();

const messageState = ref<MessageForm>({
	text: '',
	attachedFiles: [],
});

const attachDialogState = ref({
	show: false,
	contentType: 'file' as Exclude<Message['type'], 'text'>,
});

const textareaValue = computed({
	get: () => !attachDialogState.value.show ? messageState.value.text : '',
	set: (val: string) => messageState.value.text = val,
});

const submitHandler = () => {
	if (msgToEditState.value.isEditing) {
		updateMessage();
	}
	else {
		createMessage('text');
	}
}
const createMessage = (type: Message['type'] = 'text', attachData?: AttachedContent) => {
	if (messageState.value.text || attachData) {
		emit('createMessage', type, {
			text: messageState.value.text,
			attachments: attachData
		} as AttachFormContent);
		messageState.value = { text: '', attachedFiles: [] };
		msgToEditState.value.isEditing = false;
	}
};

const attachFiles = async (type: Exclude<Message['type'], 'text'>, fileList: FileList) => {
	if (!fileList?.length)
		return;
	if (fileList.length > 10 || messageState.value.attachedFiles.length > 10) {
		showMessage('You can send only 10 files or less in one message ', 'red-darken-3', 2500);
		return;
	}
	let files: File[] = [];
	for (let i = 0; i < fileList.length; i++) {
		files.push(fileList.item(i) as File);
	}
	if (type === 'media' && files.length) {
		files = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
		attachDialogState.value.contentType = 'media';
	}
	else if (type === 'file') attachDialogState.value.contentType = 'file';
	messageState.value.attachedFiles = files.map(f => ({ id: uuidv4(), fileData: f }));
	attachDialogState.value.show = true;
};
const changeContentType = () => {
	if (attachDialogState.value.contentType === 'media') {
		attachDialogState.value.contentType = 'file';
	}
	else if (attachDialogState.value.contentType === 'file' && messageState.value.attachedFiles.every(({ fileData }) => fileData.type.startsWith('image/'))) {
		attachDialogState.value.contentType = 'media';
	}
};
const onInputPasted = (e: ClipboardEvent) => {
	if (e.clipboardData?.types.includes('Files')) {
		const attachedFiles = e.clipboardData.files;
		console.log(attachedFiles);
		if (Array.from(attachedFiles).every(f => f.type.startsWith('image/'))) {
			attachFiles('media', attachedFiles);
		} else {
			attachFiles('file', attachedFiles);
		}
	}
};
const msgToEditState = ref({
	isEditing: false,
	id: '' as Message['id'],
	type: '' as Message['type'],
	content: null as Message['content'] | null,
});
watchEffect(() => {
	if (!msgToEditState.value.isEditing) {
		msgToEditState.value = { ...msgToEditState.value, id: '', content: null };
		messageState.value.text = '';
	}
});

const editMessage = ({ id, type, content }: EditMessageData) => {
	messageState.value.text = content.text;
	msgToEditState.value = { id, type, content, isEditing: true };
};
const updateMessage = () => {
	if (messageState.value.text && msgToEditState.value.id) {
		const { id, type } = msgToEditState.value;
		emit('updateMessage', { id, type, content: { text: messageState.value.text } } as EditMessageData);
		msgToEditState.value.isEditing = false;
	}
};
const showReply = computed({
	get: () => msgToEditState.value.isEditing,
	set: (val: boolean) => msgToEditState.value.isEditing = val,
});
const closeDialog = () => {
	messageState.value.attachedFiles = [];
};
defineExpose({
	editMessage
});
</script>

<style lang="scss" scoped>
.message-form {
	position: relative;
}
.message-textarea {
	position: relative;
	flex: 1 1 auto;
}
.reply-wrapper {
	position: relative;
	top: 2px;
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
</style>