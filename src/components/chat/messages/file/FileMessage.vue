<template>
	<div class="file-message__wrapper">
		<div v-for="file of files" :key="file.id" class="d-flex align-center mb-2">
			<v-hover v-slot="{ isHovering, props }">
				<div class="file-icon" v-bind="props" style="cursor: pointer;">
					<v-icon icon="mdi-file" size="60px" />
					<span v-if="!isHovering" class="file-icon-ext font-weight-bold text-brown-darken-4">
						{{ file.fullname.split('.')[file.fullname.split('.').length - 1] }}
					</span>
					<v-btn v-else icon="mdi-download" size="default" variant="text" class="file-icon-btn" color="black"
						density="compact" @click="downloadFile(file)" title="Download" />
					<a v-if="showLink" hidden ref="linkElem" :href="downloadURL" :download="file.fullname" title="Download"></a>
				</div>
			</v-hover>
			<div class="ml-2 text-subtitle-1 font-weight-medium">
				<p class="text-subtitle-1" :title="file.fullname">{{ file.fullname }}</p>
				<p class="mt-1 text-body-2">{{ formatFileSize(file.size) }}</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, PropType } from 'vue';
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
const showLink = ref(false);
const downloadURL = ref<string>('');

const downloadFile = async (file: FileMessage['files'][number]) => {
	showLink.value = true;
	const storage = useFirebaseStorage();
	const blobFile = await getBlob(storageRef(storage, file.fullpath));
	downloadURL.value = URL.createObjectURL(blobFile);
	linkElem.value?.click();
	showLink.value = false;
	URL.revokeObjectURL(downloadURL.value);
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
</style>