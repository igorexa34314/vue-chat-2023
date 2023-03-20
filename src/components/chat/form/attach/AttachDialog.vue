<template>
	<v-dialog v-if="formState.files.length" v-model="dialog" width="auto" persistent class="attach-dialog">
		<v-card width="560px" variant="flat" elevation="3">
			<v-card-title class="d-flex align-center mt-2">
				<v-btn icon="mdi-close" variant="text" @click="closeDialog" />
				<h3 class="text-center flex-grow-1">{{ 'Отправить ' + formState.files.length + ' ' + (contentType === 'image' ?
					'фото' :
					formState.files.length === 1 ? 'файл' : formState.files.length > 4 ? 'файлов' : 'файла') }}</h3>
			</v-card-title>
			<v-card-text class="py-1">
				<div class="attachments custom-scroll py-2 pr-4">
					<component
						:is="contentType === 'image' ? MediaAttachment : contentType === 'file' ? FileAttachment : undefined"
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
import type { FileMessage, MediaMessage } from '@/types/db/MessagesTable';
import type { AttachFormContent } from '@/services/message';

export type AttachedContent = (AttachDialogProps['fileList'][number] & { sizes?: { w: number, h: number }, preview?: string })[];
export interface AttachDialogProps {
	modelValue?: boolean;
	contentType: 'image' | 'video' | 'file';
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
	if (props.contentType === 'image') {
		return (attachment as Ref<InstanceType<typeof MediaAttachment>>).value?.isImgsReady;
	}
	return true;
});

const readFilesAsURL = (file: AttachDialogProps['fileList'][number]): Promise<AttachedContent[number]> => {
	return new Promise((res, rej) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const preview = e.target?.result?.toString();
			if (file.fileData.type.startsWith('image/')) {
				const image = new Image();
				image.src = preview || '';
				image.onload = () => {
					res({ ...file, sizes: { w: image.naturalWidth, h: image.naturalHeight }, preview } as AttachedContent[number]);
				};
				image.onerror = () => rej(image);
			}
			else res({ ...file, preview, } as AttachedContent[number]);
		};
		reader.onerror = () => rej(reader);
		reader.readAsDataURL(file.fileData);
	});
};
watchEffect(async () => {
	if (props.fileList.length) {
		const promises: Promise<AttachedContent[number]>[] = [];
		for (const fileItem of props.fileList) {
			if (fileItem.fileData.size > 3145728) {
				showMessage('Допустимый размер файлов - до 3 Мбайт', 'red-darken-3', 2500);
				closeDialog();
				return;
			}
			promises.push(readFilesAsURL(fileItem));
		}
		try {
			(await Promise.all(promises)).forEach(item => {
				const { id, sizes, preview, ...fData } = item;
				formState.files.push({ id, sizes, preview, ...fData });
			})
		} catch (e: unknown) {
			console.error(e);
		}
	}
});
const clearForm = () => {
	formState.subtitle = '';
	formState.files = [];
};
const submitHandler = () => {
	const { subtitle, files } = formState;
	emit('submit', props.contentType, {
		subtitle,
		files: files.map(file => {
			const { preview, ...f } = file;
			return f;
		}),
	} as AttachFormContent);
	closeDialog();
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
</style>