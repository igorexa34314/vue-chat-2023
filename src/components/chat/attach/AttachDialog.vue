<template>
	<v-dialog v-if="attachedFiles.length" v-model="dialog" max-width="560px" width="100%" persistent class="attach-dialog">
		<v-card variant="flat" elevation="3">
			<v-card-title class="d-flex align-center mt-2">
				<v-btn :icon="mdiClose" variant="text" @click="closeDialog" />
				<h3 class="text-center flex-grow-1">{{ 'Отправить ' + attachedFiles.length + ' ' + (contentType === 'media' ?
					'фото' :
					attachedFiles.length === 1 ? 'file' : attachedFiles.length > 4 ? 'files' : 'files') }}</h3>
				<v-menu location="bottom left" :offset="[0, -30]" :elevation="8">
					<template #activator="{ props }">
						<v-btn v-bind="props" variant="text" :icon="mdiDotsVertical" />
					</template>
					<v-list density="compact" class="bg-blue-grey-darken-4" min-width="180">
						<v-list-item style="cursor: pointer; padding: 0;" class="add-attachment">
							<label for="add-more" style="cursor: pointer; display: block; padding: 4px 0.7em;">
								<v-icon :icon="mdiPlus" class="mr-3" />
								<span>Добавить еще</span>
								<input id="add-more" type="file" :accept="contentType === 'media' ? 'image/*,media/*' : undefined"
									style="display:none;" @change="addMoreFiles" multiple>
							</label>
						</v-list-item>
						<v-list-item
							v-if="contentType !== 'file' || attachedFiles.every(f => f.fileData.type.startsWith('image/'))"
							density="compact" @click="emit('changeContentType')" class="px-3">
							<template #prepend>
								<v-icon :icon="contentType !== 'file' ? mdiFileMultipleOutline : mdiFolderMultipleImage"
									class="mr-3" />
							</template>
							<v-list-item-title>{{ `Send as ${contentType !== 'file' ? 'file' : 'media'}`
							}}</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-menu>
			</v-card-title>

			<v-card-text class="py-1">
				<div class="attachments custom-scroll py-2 pr-4">
					<component :is="contentType === 'media' ? MediaAttachment : FileAttachment"
						v-bind="{ files: attachedFiles }" ref="attachment" @deleteAttach="deleteAttachItem" />
				</div>

				<v-form class="d-flex align-end mt-6 mb-3 px-2" @submit.prevent="submitHandler">
					<v-textarea v-model="subtitle" variant="plain" placeholder="Add description" class="mr-4 mb-1" hide-details
						style="transform: translateY(-11px);" rows="1" max-rows="4" auto-grow focused @paste="onInputPasted" />
					<v-btn type="submit" color="light-blue-darken-4" :disabled="!isDialogReady" class="ml-1 mb-2"
						rounded>Submit</v-btn>
				</v-form>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { mdiClose, mdiDotsVertical, mdiPlus, mdiFileMultipleOutline, mdiFolderMultipleImage } from '@mdi/js';
import FileAttachment from '@/components/chat/attach/FileAttachment.vue';
import MediaAttachment from '@/components/chat/attach/MediaAttachment.vue';
import { ref, computed, watchEffect, Ref } from "vue";
import { useVModel } from '@vueuse/core';
import { useSnackbarStore } from '@/stores/snackbar';
import { getFileThumbAndSizes } from '@/utils/resizeFile';
import { Message } from '@/types/db/MessagesTable';
import { ThumbResult } from '@/utils/resizeFile';

export type AttachedContent = (AttachDialogProps['fileList'][number] & { sizes?: { w: number, h: number }, thumbnail?: ThumbResult, preview?: string })[];
export interface AttachDialogProps {
	modelValue?: boolean;
	subtitleText: string;
	contentType: 'media' | 'file';
	fileList: { id: string; fileData: File }[]
}
const props = withDefaults(defineProps<AttachDialogProps>(), {
	modelValue: false,
	subtitle: '',
});

const emit = defineEmits<{
	'update:modelValue': [val: boolean],
	'update:subtitleText': [val: boolean],
	'add-more-files': [type: Exclude<Message['type'], 'text'>, files: FileList],
	changeContentType: [],
	submit: [type: AttachDialogProps['contentType'], content: AttachedContent],
	close: []
}>();

const { showMessage } = useSnackbarStore();

const attachment = ref<InstanceType<typeof MediaAttachment> | InstanceType<typeof FileAttachment>>();
const dialog = useVModel(props, 'modelValue', emit);
const subtitle = useVModel(props, 'subtitleText', emit);

const attachedFiles = ref<AttachedContent>([]);

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
				showMessage('Maximum file size - 3 Mb', 'red-darken-3', 2500);
				closeDialog();
				return;
			}
			promises.push(getFileThumbAndSizes(fileItem));
		}
		try {
			(await Promise.all(promises)).forEach(item => {
				attachedFiles.value.push(item);
			})
		} catch (e) {
			console.error(e);
		}
	}
});
const clearForm = () => {
	attachedFiles.value = [];
};
const submitHandler = () => {
	emit('submit', props.contentType, attachedFiles.value.map(({ preview, ...f }) => f));
	closeDialog();
};
const addMoreFiles = (e: Event) => {
	const files = (e.target as HTMLInputElement).files;
	if (files && files.length) {
		emit('add-more-files', props.contentType !== 'file' ? 'media' : 'file', files);
	}
	(e.target as HTMLInputElement).files = null;
};
const onInputPasted = (e: ClipboardEvent) => {
	if (e.clipboardData?.types.includes('Files') && attachedFiles.value.length < 10) {
		const attachData = e.clipboardData.files;
		emit('add-more-files', props.contentType !== 'file' ? 'media' : 'file', attachData);
	}
};
const closeDialog = () => {
	emit('update:modelValue', false);
	clearForm();
	emit('close');
};
const deleteAttachItem = (fileId: AttachedContent[number]['id']) => {
	attachedFiles.value = attachedFiles.value.filter(file => file.id !== fileId);
	if (!attachedFiles.value.length) {
		closeDialog();
	}
};
</script>

<style lang="scss" scoped>
// Custom scroll
$scroll-width: 0.35rem !important;

@import "@/assets/styles/scroll";

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
.add-attachment {
	transition: all .1s ease-in 0s;
	&:hover {
		background-color: rgba(255, 255, 255, 0.12);
	}
}
</style>