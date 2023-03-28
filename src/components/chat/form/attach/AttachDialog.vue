<template>
	<v-dialog v-if="formState.files.length" v-model="dialog" width="auto" persistent class="attach-dialog">
		<v-card width="560px" variant="flat" elevation="3">
			<v-card-title class="d-flex align-center mt-2">
				<v-btn icon="mdi-close" variant="text" @click="closeDialog" />
				<h3 class="text-center flex-grow-1">{{ 'Отправить ' + formState.files.length + ' ' + (contentType === 'media' ?
					'фото' :
					formState.files.length === 1 ? 'файл' : formState.files.length > 4 ? 'файлов' : 'файла') }}</h3>

				<v-menu location="bottom left" :offset="[0, -30]" :elevation="8">
					<template #activator="{ props }">
						<v-btn v-bind="props" variant="text" icon="mdi-dots-vertical" />
					</template>
					<v-list density="compact" class="bg-blue-grey-darken-4" min-width="180">
						<v-list-item style="cursor: pointer; padding: 0;" class="add-attachment">
							<label for="add-more" style="cursor: pointer; display: block; padding: 4px 0.7em;">
								<v-icon icon="mdi-plus" class="mr-3" />
								<span>Добавить еще</span>
								<input id="add-more" type="file" :accept="contentType === 'media' ? 'image/*,media/*' : undefined"
									style="display:none;" @change="addMoreFiles" multiple>
							</label>
						</v-list-item>
						<v-list-item
							v-if="contentType !== 'file' || formState.files.every(f => f.fileData.type.startsWith('image/'))"
							density="compact" @click="emit('changeContentType')" class="px-3">
							<template #prepend>
								<v-icon :icon="contentType !== 'file' ? 'mdi-file-multiple-outline' : 'mdi-folder-multiple-image'"
									class="mr-3" />
							</template>
							<v-list-item-title>{{ `Отправить как ${contentType !== 'file' ? 'файлы' : 'медиа'}`
							}}</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-menu>

			</v-card-title>
			<v-card-text class="py-1">

				<div class="attachments custom-scroll py-2 pr-4">
					<component :is="contentType === 'media' ? MediaAttachment : FileAttachment"
						v-bind="{ files: formState.files }" ref="attachment" @deleteAttach="deleteAttachItem" />
				</div>

				<v-form class="d-flex align-center mt-6 mb-3 px-2" @submit.prevent="submitHandler">
					<v-text-field v-model="formState.subtitle" variant="plain" placeholder="Добавить подпись" class="mr-4"
						hide-details autofocus style="transform: translateY(-11px);" />
					<v-btn type="submit" color="light-blue-darken-4" :disabled="!isDialogReady" class="ml-1"
						rounded>Отправить</v-btn>
				</v-form>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import FileAttachment from '@/components/chat/form/attach/FileAttachment.vue';
import MediaAttachment from '@/components/chat/form/attach/MediaAttachment.vue';
import { ref, reactive, computed, watchEffect, Ref } from "vue";
import { useVModel } from '@vueuse/core';
import { useSnackbarStore } from '@/stores/snackbar';
import { getFileThumbAndSizes } from '@/utils/resizeFile';
import type { Message, FileMessage, MediaMessage } from '@/types/db/MessagesTable';
import type { AttachFormContent } from '@/services/message';
import type { ThumbResult } from '@/utils/resizeFile';


export type AttachedContent = (AttachDialogProps['fileList'][number] & { sizes?: { w: number, h: number }, thumbnail?: ThumbResult, preview?: string })[];
export interface AttachDialogProps {
	modelValue?: boolean;
	contentType: 'media' | 'file';
	fileList: { id: string; fileData: File }[]
}
interface SubmitAttachmentForm {
	subtitle: MediaMessage['subtitle'] | FileMessage['subtitle'];
	files: AttachedContent
}
const props = withDefaults(defineProps<AttachDialogProps>(), {
	modelValue: false
});

const emit = defineEmits<{
	(e: 'update:modelValue', val: boolean): void
	(e: 'add-more-files', type: Exclude<Message['type'], 'text'>, files: FileList): void
	(e: 'changeContentType'): void
	(e: 'submit', type: AttachDialogProps['contentType'], content: AttachFormContent): void
	(e: 'close'): void
}>();

const { showMessage } = useSnackbarStore();

const attachment = ref<InstanceType<typeof MediaAttachment> | InstanceType<typeof FileAttachment>>();
const dialog = useVModel(props, 'modelValue', emit)
const formState: SubmitAttachmentForm = reactive({
	subtitle: '',
	files: [],
});

const isDialogReady = computed(() => {
	if (props.contentType === 'media') {
		return (attachment as Ref<InstanceType<typeof MediaAttachment>>).value?.isImgsReady;
	}
	else if (props.contentType === 'file') {
		return (attachment as Ref<InstanceType<typeof FileAttachment>>).value?.isFilesReady;
	}
	return true;
});

watchEffect(async () => {
	if (props.fileList.length) {
		const promises: Promise<AttachedContent[number]>[] = [];
		for (const fileItem of props.fileList) {
			if (fileItem.fileData.size > 3145728) {
				showMessage('Допустимый размер файлов - до 3 Мбайт', 'red-darken-3', 2500);
				closeDialog();
				return;
			}
			promises.push(getFileThumbAndSizes(fileItem));
		}
		try {
			(await Promise.all(promises)).forEach(item => {
				formState.files.push(item);
			})
		} catch (e) {
			console.error(e);
		}
	}
});
const clearForm = () => {
	formState.subtitle = '';
	formState.files = [];
};
const submitHandler = () => {
	const { subtitle, files } = formState as SubmitAttachmentForm;
	emit('submit', props.contentType, {
		subtitle,
		files: files.map(({ preview, ...f }) => f),
	} as AttachFormContent);
	closeDialog();
};
const addMoreFiles = (e: Event) => {
	const files = (e.target as HTMLInputElement).files;
	if (files && files.length) {
		emit('add-more-files', props.contentType !== 'file' ? 'media' : 'file', files);
	}
	(e.target as HTMLInputElement).files = null;
};
const closeDialog = () => {
	emit('update:modelValue', false);
	clearForm();
	emit('close');
};
const deleteAttachItem = (fileId: AttachedContent[number]['id']) => {
	formState.files = formState.files.filter(file => file.id !== fileId);
	if (!formState.files.length) {
		closeDialog();
	}
};
</script>

<style lang="scss" scoped>
.attachments {
	overflow: auto;
	max-height: 420px;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	row-gap: 0.5em;
}
.attach-dialog :deep(.v-overlay__scrim) {
	background: #000000;
	opacity: 55%;
}
::-webkit-scrollbar {
	width: 0.35rem;
}
::-webkit-scrollbar-track {
	border-radius: 0.5rem;
}
::-webkit-scrollbar-thumb {
	background-color: rgba($color: #ffffff, $alpha: .2);
	border-radius: 0.5rem;
	transition: all 0.35s ease-in 0s;
	&:hover {
		background-color: rgba($color: #ffffff, $alpha: .4);
		transition: all 0.35s ease-in 0s;
	}
}
.add-attachment {
	transition: all .1s ease-in 0s;
	&:hover {
		background-color: rgba(255, 255, 255, 0.12);
	}
}
</style>