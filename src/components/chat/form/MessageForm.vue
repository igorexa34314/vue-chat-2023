<template>
	<div>
		<div class="message-form d-flex flex-row align-end">
			<div class="message-textarea">
				<Transition name="reply">
					<MessageReply v-model="showReply" :m-type="msgToEditState.type" :content="msgToEditState.content"
						class="reply-wrapper" @click="scrollIntoMessage" />
				</Transition>
				<v-textarea v-model.trim="textareaValue" variant="solo" hide-details @keyup.enter="createMessage('text')"
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
			<v-btn :icon="msgToEditState.isEditing ? mdiCheck : mdiSend"
				:label="msgToEditState.isEditing ? 'Подтвердить' : 'Отправить'" class="ml-3 mb-1" @click="submitHandler" />
		</div>
		<AttachDialog v-model="attachDialogState.show" v-model:subtitleText="messageState.text"
			:contentType="attachDialogState.contentType" :fileList="messageState.attachedFiles" @submit="createMessage"
			@close="closeDialog" @add-more-files="attachFiles" @change-content-type="changeContentType" />
	</div>
</template>

<script setup lang="ts">
import { mdiAttachment, mdiSend, mdiCheck } from '@mdi/js';
import MessageReply from './MessageReply.vue';
import AttachMenu from '@/components/chat/form/attach/AttachMenu.vue';
import AttachDialog, { AttachDialogProps, AttachedContent } from '@/components/chat/form/attach/AttachDialog.vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { reactive, computed, watchEffect } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { AttachFormContent } from '@/services/message';
import { Message } from '@/stores/messages';
import { MessageContent } from '@/types/db/MessagesTable';

export type EditMessageData = Pick<Message, 'id' | 'type' | Partial<'content'>>;
interface messageForm extends Omit<MessageContent, 'attachments'> {
	attachedFiles: AttachDialogProps['fileList']
};

const { showMessage } = useSnackbarStore();
const emit = defineEmits<{
	(e: 'createMessage', msgType: Message['type'], msgContent: Partial<AttachFormContent>): void;
	(e: 'updateMessage', mData: EditMessageData): void;
	(e: 'scrollToMessage', mId: Message['id']): void;
}>();
const messageState: messageForm = reactive({
	text: '',
	attachedFiles: [],
});

const attachDialogState = reactive({
	show: false,
	contentType: 'file' as Exclude<Message['type'], 'text'>,
});

const textareaValue = computed({
	get: () => !attachDialogState.show ? messageState.text : '',
	set: (val: string) => messageState.text = val,
});

const submitHandler = () => {
	if (msgToEditState.isEditing) {
		updateMessage();
	}
	else {
		createMessage('text');
	}
}
const createMessage = (type: Message['type'] = 'text', attachData?: AttachedContent) => {
	if (messageState.text || attachData) {
		emit('createMessage', type, {
			text: messageState.text,
			attachments: attachData
		} as AttachFormContent);
		messageState.text = '';
		messageState.attachedFiles = [];
		msgToEditState.isEditing = false;
	}
};

const attachFiles = async (type: Exclude<Message['type'], 'text'>, fileList: FileList) => {
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
		attachFiles('media', attachedFiles);
	}
};
const msgToEditState = reactive({
	isEditing: false,
	id: '' as Message['id'],
	type: '' as Message['type'],
	content: null as Message['content'] | null,
});
watchEffect(() => {
	if (!msgToEditState.isEditing) {
		msgToEditState.id = '';
		msgToEditState.content = null;
		messageState.text = '';
	}
});
const scrollIntoMessage = () => {
	const msg = document.querySelector(`[data-message-id="${msgToEditState.id}"]`);
	msg?.scrollIntoView({ behavior: 'smooth' });
	emit('scrollToMessage', msgToEditState.id);
};
const editMessage = ({ id, type, content }: EditMessageData) => {
	msgToEditState.id = id;
	msgToEditState.type = type;
	msgToEditState.content = content;
	messageState.text = content.text;
	msgToEditState.isEditing = true;
};
const updateMessage = () => {
	if (messageState.text && msgToEditState.id) {
		const { id, type } = msgToEditState;
		emit('updateMessage', { id, type, content: { text: messageState.text } } as EditMessageData);
		msgToEditState.isEditing = false;
	}
};
const showReply = computed({
	get: () => msgToEditState.isEditing,
	set: (val: boolean) => msgToEditState.isEditing = val,
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
	z-index: 0;
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
	transition: all 0.2s ease-in;
}

.reply-enter-from,
.reply-leave-to {
	top: 50%;
	opacity: 0;
}
</style>