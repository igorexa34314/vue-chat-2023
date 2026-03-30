<template>
	<v-slide-y-reverse-transition hide-on-leave>
		<v-card
			v-if="modelValue"
			v-bind="$attrs"
			class="reply-wrapper"
			color="grey-darken-4"
			density="compact"
			variant="flat"
			rounded="0"
			elevation="0">
			<template #prepend>
				<v-icon :icon="mdiPencil" class="mr-1" />
			</template>
			<template #title>
				<div class="reply-original d-flex align-center pa-2" @click="emit('goToMessage')">
					<div
						class="reply-original-media d-flex align-center"
						v-if="getImagesFromEditMsg && getImagesFromEditMsg.length">
						<v-img
							:src="getImagesFromEditMsg.at(-1)"
							aspect-ratio="1"
							width="48px"
							height="100%"
							cover />
					</div>
					<div class="reply-original-content-wrapper flex-fill text-truncate">
						<div class="reply-type">Editing</div>
						<div class="reply-original-text">
							<p>{{ getTextFromEditMsg }}</p>
						</div>
					</div>
				</div>
			</template>
			<template #append>
				<v-icon :icon="mdiClose" @click="cancelReply" class="ml-2" />
			</template>
		</v-card>
	</v-slide-y-reverse-transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { mdiPencil, mdiClose } from '@mdi/js';
import type { MessageContent } from '@/services/message';
import type { AttachmentType } from '@/types/db/MessagesTable';

const { content } = defineProps<{
	content: MessageContent | null;
}>();

const emit = defineEmits<{
	goToMessage: [];
	cancel: [];
}>();

const modelValue = defineModel<boolean>();

defineOptions({
	inheritAttrs: false,
});

const getTextFromEditMsg = computed(() => {
	return content?.type === 'text'
		? content?.text
		: !getImagesFromEditMsg.value || !getImagesFromEditMsg.value.length
			? (content as MessageContent<AttachmentType> | null)?.attachments.at(-1)?.fullname
			: (getImagesFromEditMsg.value.length === 1 ? 'Photo' : 'Album') + ', ' + content?.text;
});
const getImagesFromEditMsg = computed(() =>
	(content as MessageContent<AttachmentType> | null)?.attachments
		?.filter(item => item.raw.previewURL)
		.map(img => img.raw.previewURL)
);
const cancelReply = () => {
	modelValue.value = false;
	emit('cancel');
};
</script>

<style lang="scss" scoped>
.reply {
	&-wrapper {
		border-radius: 0.75rem 0.75rem 0 0 !important;

		:deep(.v-card-item) {
			padding: 0.45rem 1rem;
		}

		:deep(.v-card-title) {
			font-size: 1rem;
			line-height: 1.33;
		}
	}
	&-type {
		margin-bottom: 0.45rem;
		color: #7e57c2;
	}
	&-original {
		cursor: pointer;
		gap: 0.8em;
		border-radius: 0.35rem;
		transition: background-color 0.05s ease-in-out 0s;
		&:hover {
			background-color: rgba(255, 255, 255, 0.2);
		}
		&-content-wrapper {
		}
		&-media {
			flex: 0 0 48px;
			height: 48px;
		}
		&-text {
			max-width: 100%;
		}
	}
}
</style>
