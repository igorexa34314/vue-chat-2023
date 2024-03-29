<template>
	<v-dialog
		v-if="attachedFiles.length"
		v-model="dialog"
		max-width="560px"
		width="100%"
		:persistent="!mobile"
		class="attach-dialog mx-6 mx-md-4">
		<v-card variant="flat" elevation="3">
			<v-card-title class="d-flex align-center mt-2">
				<v-btn :icon="mdiClose" variant="text" @click="closeDialog" />
				<h3 class="text-center text-h6 text-sm-h5 flex-grow-1">
					{{
						'Send ' +
						attachedFiles.length +
						' ' +
						(contentType === 'media'
							? 'image'
							: attachedFiles.length === 1
							? 'file'
							: attachedFiles.length > 4
							? 'files'
							: 'files')
					}}
				</h3>
				<v-menu location="bottom left" :offset="[0, -30]" :elevation="8">
					<template #activator="{ props }">
						<v-btn v-bind="props" variant="text" :icon="mdiDotsVertical" />
					</template>
					<v-list density="compact" class="bg-blue-grey-darken-4" min-width="180">
						<v-list-item style="cursor: pointer" class="add-attachment pa-0">
							<label for="add-more" style="cursor: pointer; padding: 4px 0.7em" class="d-block">
								<v-icon :icon="mdiPlus" class="mr-3" />
								<span>Add more</span>
								<input
									id="add-more"
									type="file"
									:accept="contentType === 'media' ? 'image/*,media/*' : undefined"
									class="d-none"
									@change="addMoreFiles"
									multiple />
							</label>
						</v-list-item>
						<v-list-item
							v-if="contentType !== 'file' || attachedFiles.every(f => f.fileData.type.startsWith('image/'))"
							density="compact"
							@click="emit('changeContentType')"
							class="px-3">
							<template #prepend>
								<v-icon
									:icon="contentType !== 'file' ? mdiFileMultipleOutline : mdiFolderMultipleImage"
									class="mr-3" />
							</template>
							<v-list-item-title>{{ `Send as ${contentType !== 'file' ? 'file' : 'media'}` }}</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-menu>
			</v-card-title>

			<v-card-text class="py-1 px-sm-6 px-3">
				<div
					class="attachments overflow-auto d-flex flex-column justify-start custom-scroll py-1 py-sm-2 px-1 pl-md-0 pr-md-4">
					<component
						:is="contentType === 'media' ? MediaAttachment : FileAttachment"
						v-bind="{ files: attachedFiles }"
						ref="attachComponent"
						@deleteAttach="deleteAttachItem" />
				</div>

				<v-form class="d-flex align-end mt-2 mt-md-6 mb-3 px-2" @submit.prevent="submitHandler">
					<v-textarea
						v-model="subtitle"
						variant="plain"
						placeholder="Add description"
						class="mr-4 mb-1"
						hide-details
						style="transform: translateY(-11px)"
						rows="1"
						max-rows="4"
						auto-grow
						focused
						@paste="onInputPasted" />
					<v-btn
						type="submit"
						color="light-blue-darken-4"
						:disabled="!isDialogReady"
						class="ml-1 mb-3 mb-sm-4 mb-md-2"
						rounded
						>Submit</v-btn
					>
				</v-form>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { mdiClose, mdiDotsVertical, mdiPlus, mdiFileMultipleOutline, mdiFolderMultipleImage } from '@mdi/js';
import FileAttachment from '@/components/chat/attach/FileAttachment.vue';
import MediaAttachment from '@/components/chat/attach/MediaAttachment.vue';
import { ref, computed, watch, type Ref } from 'vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { getFileThumbAndSizes } from '@/utils/resizeFile';
import { useDisplay } from 'vuetify';
import type { AttachmentType } from '@/types/db/MessagesTable';
import type { FormAttachment } from '@/services/message';

export type AttachedContent<T extends AttachmentType = 'media'> = FormAttachment<T> & {
	preview: T extends 'media' ? string : never;
};

const { contentType, fileList } = defineProps<{
	contentType: AttachmentType;
	fileList: FormAttachment[];
}>();

const emit = defineEmits<{
	'add-more-files': [type: AttachmentType, files: FileList];
	changeContentType: [];
	submit: [type: AttachmentType, content: FormAttachment[]];
	close: [];
}>();

const dialog = defineModel<boolean>('modelValue', { default: false });
const subtitle = defineModel<string>('subtitleText', { default: '' });

const { showMessage } = useSnackbarStore();
const { mobile } = useDisplay();

type AttachComponent<T extends AttachmentType = AttachmentType> = InstanceType<
	T extends 'media' ? typeof MediaAttachment : typeof FileAttachment
>;
const attachComponent = ref<AttachComponent | null>(null);

const attachedFiles = ref([]) as Ref<AttachedContent[]>;
const isDialogReady = computed(() => {
	if (contentType === 'media') {
		return (attachComponent.value as AttachComponent<'media'> | undefined)?.isImgsReady;
	} else if (contentType === 'file') {
		return (attachComponent.value as AttachComponent<'file'> | undefined)?.isFilesReady;
	}
	return true;
});

watch(
	() => fileList.length,
	async newLength => {
		if (newLength) {
			if (fileList.every(f => f.fileData.size <= 3145728)) {
				Promise.all(fileList.map(file => getFileThumbAndSizes(file)))
					.then(result => (attachedFiles.value = result as AttachedContent[]))
					.catch(err => console.error(err));
			} else showMessage('Maximum file size - 3 Mb', 'red-darken-3', 2500);
		} else closeDialog();
	}
);
const clearForm = () => {
	attachedFiles.value = [];
};
const submitHandler = () => {
	emit(
		'submit',
		contentType,
		attachedFiles.value.map(({ preview, ...f }) => f)
	);
	closeDialog();
};
const addMoreFiles = (e: Event) => {
	const files = (e.target as HTMLInputElement).files;
	if (files && files.length) {
		emit('add-more-files', contentType !== 'file' ? 'media' : 'file', files);
	}
	(e.target as HTMLInputElement).files = null;
};
const onInputPasted = (e: ClipboardEvent) => {
	if (e.clipboardData?.types.includes('Files') && attachedFiles.value.length < 10) {
		const attachData = e.clipboardData.files;
		emit('add-more-files', contentType !== 'file' ? 'media' : 'file', attachData);
	}
};
const closeDialog = () => {
	dialog.value = false;
	clearForm();
	emit('close');
};
const deleteAttachItem = (fileId: AttachedContent['id']) => {
	attachedFiles.value = attachedFiles.value.filter(file => file.id !== fileId);
	if (!attachedFiles.value.length) {
		closeDialog();
	}
};
</script>

<style lang="scss" scoped>
// Custom scroll
$scroll-width: 0.35rem !important;
@import '@/assets/styles/scroll';

.attachments {
	max-height: 420px;
	row-gap: 0.5em;
}
.attach-dialog :deep(.v-overlay__scrim) {
	background-color: #000000;
	opacity: 55%;
}
.add-attachment {
	transition: all 0.1s ease-in 0s;
	&:hover {
		background-color: rgba(255, 255, 255, 0.12);
	}
}
</style>
