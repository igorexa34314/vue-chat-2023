<template>
	<div class="reply-wrapper" v-if="modelValue">
		<v-alert variant="flat">
			<template #prepend>
				<v-icon :icon="mdiPencil" />
			</template>
			<template #title>
				<div>Редактирование</div>
			</template>
			<template #text>
				<div>
					<p></p>
				</div>
			</template>
			<template #close>
				<v-icon :icon="mdiClose" @click="cancelReply" />
			</template>
		</v-alert>
	</div>
</template>

<script setup lang="ts">
import { Message } from '@/stores/messages';
import { mdiPencil, mdiClose } from '@mdi/js';

const props = defineProps<{
	modelValue: boolean;
	content: string;
	mType?: Message['type'];
}>();
const emit = defineEmits<{
	(e: 'update:modelValue', val: boolean): void;
	(e: 'cancel'): void;
}>();
const cancelReply = () => {
	emit('update:modelValue', false);
	emit('cancel');
}
</script>

<style lang="scss" scoped></style>