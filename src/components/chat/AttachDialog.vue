<template>
	<v-dialog v-if="formState.files.length" width="auto" persistent v-model="dialog" class="attach-dialog">
		<v-card width="600px" variant="flat" elevation="3">
			<v-card-title class="d-flex align-center mt-2">
				<v-btn icon="mdi-close" variant="text" @click="closeDialog" />
				<h3 class="text-center flex-grow-1">{{ 'Отправить ' + formState.files.length + ' ' + (contentType === 'image' ?
					'фото' :
					formState.files.length === 1 ? 'файл' : formState.files.length > 4 ? 'файлов' : 'файла') }}</h3>
			</v-card-title>
			<v-card-text>
				<v-form @submit.prevent="submitHandler" :disabled="!isImgsReady">
					<div v-if="contentType === 'image'" class="images-grid">
						<v-card v-for="img of formState.files" class="image-wrapper d-flex" :key="img.id">
							<v-img ref="imgsEl" :src="img.preview" :alt="img.fileData.name" :id="img.id" cover />
						</v-card>
					</div>
					<div v-else-if="contentType === 'file'" v-for="file of formState.files" :key="file.id"
						class="d-flex align-center">
						<div class="file-icon">
							<v-icon icon="mdi-file" size="100px" />
							<span class="file-icon-ext font-weight-black text-brown-darken-4">
								{{ getFileExt(file.fileData.name) }}</span>
						</div>
						<div class="file-details ml-2 text-subtitle-1 font-weight-medium">
							<p class="text-subtitle-1">{{ file.fileData.name }}</p>
							<p class="mt-1 text-body-2">{{ formatFileSize(file.fileData.size) }}</p>
						</div>
					</div>
					<div class="d-flex align-center mt-6 mb-3 px-4">
						<v-text-field v-model="formState.subtitle" variant="plain" placeholder="Добавить подпись" class="mr-4"
							hide-details autofocus style="transform: translateY(-11px);" />
						<v-btn type="submit" color="light-blue-darken-4" size="large"
							:disabled="contentType === 'image' ? !isImgsReady : false" rounded>Отправить</v-btn>
					</div>
				</v-form>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { formatFileSize } from '@/utils/sizeFormat';
import { ref, reactive, computed, watchEffect } from "vue";
import { useVModel } from '@vueuse/core';
import { useSnackbarStore } from '@/stores/snackbar';
import type { FileMessage, MediaMessage } from '@/types/db/MessagesTable';
import type { VImg } from 'vuetify/components';
import type { AttachFormContent } from '@/stores/messages';

export type AttachedContent = (AttachDialogProps['fileList'][number] & { preview?: string })[];

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
const dialog = useVModel(props, 'modelValue', emit)
const imgsEl = ref<VImg[]>();
const isImgsReady = computed(() => props.contentType === 'image' && imgsEl.value?.every(img => img.state === 'loaded'));
const formState: SubmitAttachmentForm = reactive({
	subtitle: '',
	files: [],
});
const readFilesAsURL = (file: AttachDialogProps['fileList'][number]): Promise<AttachedContent[number]> => {
	return new Promise((res, rej) => {
		const reader = new FileReader();
		reader.onload = () => res({ ...file, preview: reader.result } as AttachedContent[number]);
		reader.onerror = () => rej(reader);
		reader.readAsDataURL(file.fileData);
	});
};
watchEffect(async () => {
	if (props.fileList.length) {
		const promises: (Promise<AttachedContent[number]>)[] = [];
		for (const item of props.fileList) {
			if (item.fileData.size > 3145728) {
				showMessage('Допустимый размер файлов - до 3 Мбайт', 'red-darken-3', 2500);
				closeDialog();
				return;
			}
			promises.push(readFilesAsURL(item));
		}
		try {
			(await Promise.all(promises)).forEach(item => {
				formState.files.push({
					id: item.id,
					fileData: item.fileData,
					preview: item.preview
				});
			})
		} catch (e) {
			console.error(e);
		}
	}
});

const submitHandler = () => {
	const { subtitle, files } = formState;
	emit('submit', props.contentType, {
		subtitle,
		files: files.map(file => {
			const { preview, ...f } = file;
			return { ...f, sizes: getImageParams(f.id) };
		}),
	} as AttachFormContent);
	emit('update:modelValue', false);
};
const closeDialog = () => {
	emit('update:modelValue', false);
	formState.subtitle = '';
	formState.files = [];
	emit('close');
};
const getImageParams = (id: AttachDialogProps['fileList'][number]['id']) => {
	const img = imgsEl.value?.find(img => img.$attrs.id === id);
	if (img?.state === 'loaded' && img.naturalHeight !== 0) {
		return {
			w: img.naturalWidth,
			h: img.naturalHeight
		}
	}
};
const getFileExt = computed(() => (filename: string) => filename.split('.')[filename.split('.').length - 1],)
</script>

<style lang="scss" scoped>
.attach-dialog :deep(.v-overlay__scrim) {
	background: #000000;
	opacity: 55%;
}
.images-grid {
	padding: 0.7em 0.2em 0.5em 0;
	overflow-x: hidden;
	overflow-y: auto;
	max-width: 450px;
	max-height: 400px;
	margin: 0 auto;
	display: grid;
	justify-content: space-between;
	grid-gap: 8px;
	grid-template-rows: repeat(auto-fit, minmax(50%, 1fr));
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	@media(max-width: 760px) {
		max-width: 400px;
	}
	@media(max-width: 560px) {
		max-width: 320px;
		grid-template-rows: repeat(auto-fit, minmax(35%, 1fr));
	}
}
.image-wrapper {}
.file-details, .file-details p {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
.file-icon {
	position: relative;
	&-ext {
		font-size: 1.1rem;
		display: inline-block;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -30%);
	}
}
::-webkit-scrollbar {
	width: 0.4rem;
}
</style>