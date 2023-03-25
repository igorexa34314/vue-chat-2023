<template>
	<div v-if="content.files.length" class="file-message__wrapper">
		<p v-if="content.subtitle.length" class="message__subtitle mb-3">{{ content.subtitle }}</p>
		<div v-for="(file, index) in content.files" :key="file.id" :class="{ 'mb-1': index !== (content.files.length - 1) }"
			class="d-flex align-center">
			<v-hover #default="{ isHovering, props }">
				<div v-if="file.thumbnail && file.sizes" v-bind="props" class="file-icon px-1"
					style="cursor: pointer; width: 80px;">
					<ImageFrame :image="file" max-height="80" width="100%" rounded="true"
						:loader="{ size: '30px', iconSize: '18px' }" />
					<Transition name="fade">
						<div class="preview-hover" v-if="isHovering">
							<v-btn icon="mdi-eye-outline" size="large" variant="text" class="file-icon-btn" color="white"
								density="compact" @click="downloadFile(file)" title="Download" :flat="false" :ripple="false" />
						</div>
					</Transition>
				</div>
				<div v-else class="file-icon" v-bind="props" style="cursor: pointer;">
					<v-icon icon="mdi-file" size="80px" />
					<Transition name="fade">
						<span v-if="!isHovering" class="file-icon-ext font-weight-bold text-brown-darken-4">
							{{ getFileExt(file.fullname).length <= 6 ? getFileExt(file.fullname) : '' }} </span>
								<v-btn v-else icon="mdi-download" size="large" variant="text" class="file-icon-btn" color="black"
									density="compact" @click="downloadFile(file)" title="Download" :flat="false" :ripple="false" />
					</Transition>
				</div>
			</v-hover>
			<div class="file-details ml-2 text-subtitle-1 font-weight-medium">
				<p class="text-subtitle-1" :title="file.fullname">{{ file.fullname }}</p>
				<p class="mt-1 text-body-2">{{ formatFileSize(file.fullsize) }}</p>
			</div>
		</div>
		<a v-if="downloadLink.show" hidden ref="linkElem" :href="downloadLink.url" :download="downloadLink.filename"
			title="Download"></a>
	</div>
</template>

<script setup lang="ts">
import ImageFrame from '@/components/chat/messages/media/ImageFrame.vue';
import { ref, reactive, PropType, watchEffect } from 'vue';
import { formatFileSize, getFileExt } from '@/utils/filters/messages';
import { ref as storageRef, getBlob } from 'firebase/storage';
import { useFirebaseStorage } from 'vuefire';
import type { FileMessage } from '@/stores/messages';

const props = defineProps({
	content: {
		type: Object as PropType<FileMessage>,
		required: true
	},
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
</script>

<style lang="scss" scoped>
.preview-hover {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: 4px;
	background-color: rgba($color: #000000, $alpha: 0.75);
}
.file-icon {
	position: relative;
	&-ext, &-btn {
		margin-left: auto;
		margin-right: auto;
		max-width: 45px;
		font-size: 1.15em;
		line-height: 1;
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
	max-width: 360px;
	p {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	@media(max-width: 720px) {
		max-width: 320px;
	}
	@media(max-width: 640px) {
		max-width: 280px;
	}
}
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>