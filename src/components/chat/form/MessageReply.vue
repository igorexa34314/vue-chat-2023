<template>
	<Transition :css="false" @before-enter="onBeforeEnter" @enter="onEnter" @leave="onLeave">
		<v-alert
			v-show="modelValue"
			v-bind="$attrs"
			class="reply-wrapper py-2"
			color="grey-darken-4"
			density="compact"
			variant="flat"
			rounded="0"
			elevation="0">
			<template #prepend>
				<v-icon :icon="mdiPencil" />
			</template>
			<template #text>
				<div class="reply-original d-flex align-center pa-2" @click="emit('goToMessage')">
					<div
						class="reply-original-media d-flex align-center"
						v-if="getImagesFromEditMsg && getImagesFromEditMsg.length">
						<v-img :src="getImagesFromEditMsg.at(-1)" aspect-ratio="1" width="48px" height="100%" cover />
					</div>
					<div class="reply-original-content-wrapper flex-fill text-truncate">
						<div class="reply-type">Editing</div>
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
	</Transition>
</template>

<script setup lang="ts">
import { VAlert } from 'vuetify/components';
import { computed } from 'vue';
import { mdiPencil, mdiClose } from '@mdi/js';
import { MessageContent } from '@/services/message';
import { gsap } from 'gsap';
import { AttachmentType } from '@/types/db/MessagesTable';

const props = withDefaults(
	defineProps<{
		modelValue?: boolean;
		content: MessageContent | null;
	}>(),
	{
		modelValue: false,
	}
);

const emit = defineEmits<{
	'update:modelValue': [val: boolean];
	goToMessage: [];
	cancel: [];
}>();

defineOptions({
	inheritAttrs: false,
});

const getTextFromEditMsg = computed(() => {
	return props.content?.type === 'text'
		? props.content?.text
		: !getImagesFromEditMsg.value || !getImagesFromEditMsg.value.length
		? (props.content as MessageContent<AttachmentType> | null)?.attachments.at(-1)?.fullname
		: (getImagesFromEditMsg.value.length === 1 ? 'Photo' : 'Album') + ', ' + props.content?.text;
});
const getImagesFromEditMsg = computed(
	() =>
		(props.content as MessageContent<AttachmentType> | null)?.attachments
			?.filter(item => item.raw.previewURL)
			.map(img => img.raw.previewURL)
);
const cancelReply = () => {
	emit('update:modelValue', false);
	emit('cancel');
};

const onBeforeEnter = (el: Element) => {
	// 	gsap.set(el, { autoAlpha: 0 })
};

const onEnter = (el: Element, done: () => void) => {
	gsap.from(el, {
		height: 0,
		duration: 0.2,
		top: '2px',
		ease: 'power2',
		onComplete: done,
	});
};

const onLeave = (el: Element, done: () => void) => {
	gsap.to(el, {
		height: 0,
		duration: 0.2,
		top: '2px',
		ease: 'power2',
		onComplete: done,
	});
};
</script>

<style lang="scss" scoped>
.reply {
	&-wrapper {
		border-radius: 0.75rem 0.75rem 0 0 !important;
	}
	&-type {
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
