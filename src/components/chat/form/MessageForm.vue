<template>
	<div class="message-form-box d-flex flex-row" v-bind="$attrs">
		<div class="message-form flex-fill elevation-2 rounded bg-grey-darken-4">
			<MessageReply
				v-model="showReply"
				:content="msgToEditState.content"
				class="reply-wrapper"
				@go-to-message="emit('scrollToMessage', msgToEditState.id)" />

			<div class="message-area d-flex h-100">
				<div
					ref="form"
					role="textbox"
					tabIndex="0"
					contentEditable="true"
					v-html="inputValue"
					@keydown.enter="submitHandler"
					:density="smAndUp ? 'default' : 'comfortable'"
					class="message-input flex-fill"
					@input="handleInput"
					@focus="isFormActive = true"
					@blur="isFormActive = false"
					@paste="onInputPasted"></div>

				<span class="text-placeholder" :class="{ shown: !inputValue }">Your message</span>

				<AttachMenu ref="attachMenuEl" @attach-file="attachFiles">
					<template #activator="{ props }">
						<div class="attach-btn d-flex align-end py-3 justify-end ml-sm-3 mr-3">
							<v-icon
								v-bind="props"
								:icon="mdiAttachment"
								:size="smAndUp ? 'large' : 'default'"
								class="attach-icon"
								:v-ripple="false" />
						</div>
					</template>
				</AttachMenu>
			</div>
		</div>

		<v-btn
			:icon="msgToEditState.isEditing ? mdiCheck : mdiSend"
			:label="msgToEditState.isEditing ? 'Submit' : 'Send'"
			class="ml-2 ml-sm-3 mb-sm-1"
			@click="submitHandler" />
	</div>

	<AttachDialog
		v-model="attachDialogState.show"
		v-model:subtitleText="attachDialogInputVal"
		:contentType="attachDialogState.contentType"
		:fileList="messageState.attachedFiles"
		@submit="createMessage"
		@close="closeDialog"
		@add-more-files="attachFiles"
		@change-content-type="changeContentType" />
</template>

<script setup lang="ts">
import AttachDialog from '@/components/chat/attach/AttachDialog.vue';
import MessageReply from '@/components/chat/form/MessageReply.vue';
import AttachMenu from '@/components/chat/attach/AttachMenu.vue';
import { mdiAttachment, mdiSend, mdiCheck } from '@mdi/js';
import { useDisplay } from 'vuetify';
import { useSnackbarStore } from '@/stores/snackbar';
import { ref, computed, watchEffect, useTemplateRef, nextTick, watch, shallowRef } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { Message, MessageContent, FormAttachment, CreateMsgForm } from '@/services/message';
import type { ContentType, AttachmentType } from '@/types/db/MessagesTable';

export type EditMessageData = { id: Message['id']; content: MessageContent };
interface IMessageForm extends Omit<MessageContent, 'type' | 'attachments'> {
	attachedFiles: FormAttachment<'file'>[];
}

const emit = defineEmits<{
	type: [msgText: IMessageForm['text']];
	createMessage: [msgContent: CreateMsgForm];
	updateMessage: [mData: EditMessageData];
	scrollToMessage: [mId: Message['id']];
}>();

defineOptions({
	inheritAttrs: false,
});

const { showMessage } = useSnackbarStore();
const { smAndUp } = useDisplay();

const msgForm = useTemplateRef('form');
const inputValue = ref('');
const attachDialogInputVal = ref('');
const isFormActive = ref(false);

const focusMsgForm = () => {
	nextTick(() => msgForm.value?.focus());
};
const messageState = ref<IMessageForm>({
	text: '',
	attachedFiles: [],
});

const attachDialogState = ref({
	show: false,
	contentType: 'file' as AttachmentType,
});

watch(
	() => attachDialogState.value.show,
	isShown => {
		if (!msgForm.value) {
			return;
		}
		if (isShown) {
			inputValue.value = '';
		} else {
			inputValue.value = messageState.value.text;
		}
	}
);

const handleInput = (event: Event) => {
	inputValue.value = (event.target as HTMLDivElement | null)?.textContent || '';
	emit('type', inputValue.value);
};

const createMessage = <T extends ContentType>(
	type: T,
	attachData?: T extends AttachmentType ? FormAttachment<T>[] : undefined
) => {
	messageState.value.text = inputValue.value.trim();
	if (messageState.value.text || attachData) {
		emit('createMessage', {
			type,
			text: messageState.value.text,
			attachments: attachData ?? [],
		});
		messageState.value = { text: '', attachedFiles: [] };
		inputValue.value = '';
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
	attachDialogInputVal.value = messageState.value.text;
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
const msgToEditState = ref<{
	id: Message['id'];
	content: MessageContent | null;
	isEditing: boolean;
}>({
	isEditing: false,
	id: '',
	content: null,
});

const showReply = computed({
	get: () => msgToEditState.value.isEditing,
	set: (val: boolean) => (msgToEditState.value.isEditing = val),
});

watch(
	() => msgToEditState.value.isEditing,
	isEditing => {
		if (!isEditing) {
			msgToEditState.value = { ...msgToEditState.value, id: '', content: null };
			messageState.value.text = '';
			inputValue.value = '';
		}
	},
	{ immediate: true }
);

const editMessage = ({ id, content }: EditMessageData) => {
	attachDialogInputVal.value = content?.text || messageState.value.text;
	msgToEditState.value = { id, content, isEditing: true };
};
const updateMessage = () => {
	messageState.value.text = attachDialogInputVal.value.trim();
	if (messageState.value.text && msgToEditState.value.id && msgToEditState.value.content) {
		const { id, content } = msgToEditState.value;
		emit('updateMessage', { id, content: { ...content, text: messageState.value.text } });
		msgToEditState.value.isEditing = false;
		attachDialogInputVal.value = '';
	}
};

const submitHandler = (event: KeyboardEvent) => {
	if (event.key === 'Enter' && !event.shiftKey) {
		if (msgToEditState.value.isEditing) {
			updateMessage();
		} else {
			createMessage('text');
		}
		event.preventDefault();
	} else if (event.code === 'Escape') {
		showReply.value = false;
		event.preventDefault();
	}
};

const closeDialog = () => {
	attachDialogInputVal.value = '';
	messageState.value.attachedFiles = [];
};
defineExpose({
	editMessage,
	attachFiles,
});
</script>

<style lang="scss" scoped>
.message-form-box {
	position: relative;
}
.message-form {
	position: relative;
}
.message-input {
	position: relative;
	padding: 16px 1rem;
	resize: none;
	border: none;
	outline: none;
	-webkit-font-smoothing: antialiased;
	box-sizing: border-box;
	max-height: 180px;
	max-width: 904px;
	overflow: scroll;
	overflow-x: hidden;
	overflow-y: auto;
	line-height: 1.31;
	&[contenteditable] {
		-moz-user-modify: read-write-plaintext-only;
		-webkit-user-modify: read-write-plaintext-only;
	}
	&::-webkit-scrollbar {
		width: 0.33rem;
	}
	&::-webkit-scrollbar-track {
		border-radius: 0.5rem;
	}
}
.text-placeholder {
	opacity: 0;
	transform: translate(1rem);
	top: 1rem;
	left: calc(1rem + 1px);
	line-height: 1.31;
	position: absolute;
	pointer-events: none;
	user-select: none;
	filter: contrast(15%);
	outline: none;
	cursor: text;
	transition:
		opacity 0.2s ease-out,
		transform 0.2s ease-out;

	&.shown {
		opacity: 1;
		transform: none;
	}
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
	transform: rotate(135deg);
}
</style>
