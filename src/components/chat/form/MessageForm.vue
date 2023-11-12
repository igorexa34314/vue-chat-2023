<template>
	<div class="message-form d-flex flex-row align-end" v-bind="$attrs">
		<div class="message-textarea flex-fill">
			<MessageReply
				v-model="showReply"
				:content="msgToEditState.content"
				class="reply-wrapper"
				@go-to-message="emit('scrollToMessage', msgToEditState.id)" />

			<v-textarea
				v-model.trim="textareaValue"
				variant="solo"
				hide-details
				@keyup.enter="submitHandler"
				placeholder="Your message"
				rows="1"
				max-rows="10"
				:density="smAndUp ? 'default' : 'comfortable'"
				auto-grow
				focused
				@paste="onInputPasted">
				<template #append-inner>
					<AttachMenu ref="attachMenuEl" @attach-file="attachFiles">
						<template #activator="{ props }">
							<div class="attach-btn d-flex align-end justify-end ml-sm-4">
								<v-icon
									v-bind="props"
									:icon="mdiAttachment"
									:size="smAndUp ? 'large' : 'default'"
									class="attach-icon"
									:v-ripple="false" />
							</div>
						</template>
					</AttachMenu>
				</template>
			</v-textarea>
		</div>

		<v-btn
			:icon="msgToEditState.isEditing ? mdiCheck : mdiSend"
			:label="msgToEditState.isEditing ? 'Submit' : 'Send'"
			class="ml-2 ml-sm-3 mb-sm-1"
			@click="submitHandler" />
	</div>

	<AttachDialog
		v-model="attachDialogState.show"
		v-model:subtitleText="messageState.text"
		:contentType="attachDialogState.contentType"
		:fileList="messageState.attachedFiles"
		@submit="createMessage"
		@close="closeDialog"
		@add-more-files="attachFiles"
		@change-content-type="changeContentType" />
</template>

<script setup lang="ts">
import { mdiAttachment, mdiSend, mdiCheck } from '@mdi/js';
import { useDisplay } from 'vuetify';
import { useSnackbarStore } from '@/stores/snackbar';
import { ref, computed, watchEffect, defineAsyncComponent } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { Message, MessageContent, FormAttachment, CreateMsgForm } from '@/services/message';
import type { ContentType, AttachmentType } from '@/types/db/MessagesTable';

export type EditMessageData = { id: Message['id']; content: MessageContent };
interface IMessageForm extends Omit<MessageContent, 'type' | 'attachments'> {
	attachedFiles: FormAttachment<'file'>[];
}

const AttachDialog = defineAsyncComponent(() => import('@/components/chat/attach/AttachDialog.vue'));
const MessageReply = defineAsyncComponent(() => import('@/components/chat/form/MessageReply.vue'));
const AttachMenu = defineAsyncComponent(() => import('@/components/chat/attach/AttachMenu.vue'));

const emit = defineEmits<{
	createMessage: [msgContent: CreateMsgForm];
	updateMessage: [mData: EditMessageData];
	scrollToMessage: [mId: Message['id']];
}>();

defineOptions({
	inheritAttrs: false,
});

const { showMessage } = useSnackbarStore();
const { smAndUp } = useDisplay();

const messageState = ref<IMessageForm>({
	text: '',
	attachedFiles: [],
});

const attachDialogState = ref({
	show: false,
	contentType: 'file' as AttachmentType,
});

const textareaValue = computed({
	get: () => (!attachDialogState.value.show ? messageState.value.text : ''),
	set: (val: string) => (messageState.value.text = val),
});

const submitHandler = () => {
	if (msgToEditState.value.isEditing) {
		updateMessage();
	} else {
		createMessage('text');
	}
};
const createMessage = <T extends ContentType>(
	type: T,
	attachData?: T extends AttachmentType ? FormAttachment<T>[] : undefined
) => {
	if (messageState.value.text || attachData) {
		emit('createMessage', { type, text: messageState.value.text, attachments: attachData ?? [] });
		messageState.value = { text: '', attachedFiles: [] };
		msgToEditState.value.isEditing = false;
	}
};

const attachFiles = async (type: AttachmentType, fileList: FileList | File[]) => {
	if (!fileList?.length) return;
	if (fileList.length > 10 || messageState.value.attachedFiles.length > 10) {
		showMessage('You can send only 10 files or less in one message ', 'red-darken-3', 2500);
		return;
	}
	let files: File[] = [];
	if (fileList instanceof FileList) {
		for (let i = 0; i < fileList.length; i++) {
			files.push(fileList.item(i) as File);
		}
	} else {
		files = fileList;
	}
	if (type === 'media' && files.length) {
		files = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
		attachDialogState.value.contentType = 'media';
	} else attachDialogState.value.contentType = type;
	messageState.value.attachedFiles = [
		...messageState.value.attachedFiles,
		...files.map(f => ({ id: uuidv4(), fileData: f })),
	];
	attachDialogState.value.show = true;
};
const changeContentType = () => {
	if (attachDialogState.value.contentType === 'media') {
		attachDialogState.value.contentType = 'file';
	} else if (
		attachDialogState.value.contentType === 'file' &&
		messageState.value.attachedFiles.every(({ fileData }) => fileData.type.startsWith('image/'))
	) {
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
const msgToEditState = ref<{ id: Message['id']; content: MessageContent | null; isEditing: boolean }>({
	isEditing: false,
	id: '',
	content: null,
});
watchEffect(() => {
	if (!msgToEditState.value.isEditing) {
		msgToEditState.value = { ...msgToEditState.value, id: '', content: null };
		messageState.value.text = '';
	}
});

const editMessage = ({ id, content }: EditMessageData) => {
	messageState.value.text = content?.text || messageState.value.text;
	msgToEditState.value = { id, content, isEditing: true };
};
const updateMessage = () => {
	if (messageState.value.text && msgToEditState.value.id && msgToEditState.value.content) {
		const { id, content } = msgToEditState.value;
		emit('updateMessage', { id, content: { ...content, text: messageState.value.text } });
		msgToEditState.value.isEditing = false;
	}
};
const showReply = computed({
	get: () => msgToEditState.value.isEditing,
	set: (val: boolean) => (msgToEditState.value.isEditing = val),
});
const closeDialog = () => {
	messageState.value.attachedFiles = [];
};
defineExpose({
	editMessage,
	attachFiles,
});
</script>

<style lang="scss" scoped>
.message-form {
	position: relative;
}
.message-textarea {
	position: relative;
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
}
.attach-icon {
	transform: rotate(135deg) translate(-20%, 50%);
}
</style>
