<template>
	<div v-if="files.length" class="file-message__wrapper">
		<div v-for="file of files" :key="file.id" class="d-flex align-center mb-2">
			<v-hover v-slot="{ isHovering, props }">
				<div class="file-icon" v-bind="props" style="cursor: pointer;">
					<v-icon icon="mdi-file" size="60px" />
					<span v-if="!isHovering" class="file-icon-ext font-weight-bold text-brown-darken-4">
						{{ file.fullname.split('.')[file.fullname.split('.').length - 1] }}
					</span>
					<v-btn v-else icon="mdi-download" size="default" variant="text" class="file-icon-btn" color="black"
						density="compact" @click="downloadFile(file)" title="Download" />
				</div>
			</v-hover>
			<div class="file-details ml-2 text-subtitle-1 font-weight-medium">
				<p class="text-subtitle-1" :title="file.fullname">{{ file.fullname }}</p>
				<p class="mt-1 text-body-2">{{ formatFileSize(file.size) }}</p>
			</div>
		</div>
		<a v-if="downloadLink.show" hidden ref="linkElem" :href="downloadLink.url" :download="downloadLink.filename"
			title="Download"></a>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, PropType } from 'vue';
import { formatFileSize as formatSize } from '@/utils/sizeFormat';
import { ref as storageRef, getBlob } from 'firebase/storage';
import { useFirebaseStorage } from 'vuefire';
import type { FileMessage } from '@/types/db/MessagesTable';

const props = defineProps({
	files: {
		type: Array as PropType<FileMessage['files']>,
		required: true
	},
	alt: String,
});

const linkElem = ref<HTMLLinkElement>();
const downloadLink = reactive({
	show: false,
	url: '',
	filename: '',
});

const downloadFile = async (file: FileMessage['files'][number]) => {
	try {
		downloadLink.show = true;
		downloadLink.filename = file.fullname;
		const storage = useFirebaseStorage();
		const blobFile = await getBlob(storageRef(storage, file.fullpath));
		downloadLink.url = URL.createObjectURL(blobFile);
		linkElem.value?.click();
		downloadLink.show = false;
		URL.revokeObjectURL(downloadLink.url);
	} catch (e: unknown) {
		console.error(e);
	}
}
const formatFileSize = computed(() => (size: number) => formatSize(size));
</script>

<style lang="scss" scoped>
.file-icon {
	position: relative;
	&-ext, &-btn {
		font-size: 1.1rem;
		display: inline-block;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -30%);
	}
	&-btn {
		transform: translate(-50%, -40%);
	}
}
.file-details {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>