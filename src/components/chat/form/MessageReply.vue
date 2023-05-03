<template>
	<div class="reply-wrapper" v-if="modelValue">
		<v-alert variant="flat" color="grey-darken-4">
			<template #prepend>
				<v-icon :icon="mdiPencil" />
			</template>
			<template #text>
				<div class="reply-original d-flex align-center">
					<div class="reply-original-media" v-if="getImagesFromEditMsg && getImagesFromEditMsg.length">
						<v-img :src="getImagesFromEditMsg.at(-1)" aspect-ratio="1" width="48px" />
					</div>
					<div class="reply-original-content-wrapper">
						<div class="reply-type">Редактирование</div>
						<div class="reply-original-text">
							<p>{{ getTextFromEditMsg }}</p>
						</div>
					</div>
				</div>
			</template>
			<template #close>
				<v-icon :icon="mdiClose" @click="cancelReply" />
			</template>
		</v-alert>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Message } from '@/stores/messages';
import { mdiPencil, mdiClose } from '@mdi/js';
import type { TextMessage } from '@/types/db/MessagesTable';
import type { MediaMessage, FileMessage } from '@/stores/messages';

const props = defineProps<{
	modelValue: boolean;
	mType: Message['type']
	content: Message['content'] | null;
}>();
const emit = defineEmits<{
	(e: 'update:modelValue', val: boolean): void;
	(e: 'cancel'): void;
}>();
const getTextFromEditMsg = computed(() => {
	return props.mType === 'text' ?
		(props.content as TextMessage).text :
		!getImagesFromEditMsg.value || !getImagesFromEditMsg.value.length ?
			(props.content as FileMessage).files.at(-1)?.fullname :
			(getImagesFromEditMsg.value.length === 1 ? 'Фотография' : 'Альбом') +
			', ' + (props.content as MediaMessage | FileMessage).subtitle;
});
const getImagesFromEditMsg = computed(() => ((props.content as MediaMessage).images || (props.content as FileMessage).files)?.filter(item => item.previewURL).map(img => img.previewURL));
const cancelReply = () => {
	emit('update:modelValue', false);
	emit('cancel');
}
</script>

<style lang="scss" scoped>
.reply {
	&-type {
		color: #7E57C2;
	}
	&-original {
		gap: 0.8em;
		&-content-wrapper {
			flex: 1 1 auto;
			overflow: hidden;
			text-overflow: ellipsis;

		}
		&-media {
			flex: 0 0 48px;
			display: flex;
			align-items: center;
			height: 48px;
		}
		&-text {
			max-width: 100%;
			white-space: nowrap;
		}
	}
}
</style>