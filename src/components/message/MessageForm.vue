<template>
	<div>
		<div class="message-form d-flex flex-row align-center">
			<v-text-field v-model.trim="messageState.text" variant="solo" hide-details @keyup.enter="createTextMessage"
				placeholder="Ваше сообщение">
				<template #append-inner>
					<AttachMenu @attachFile="attachFile" />
				</template>
			</v-text-field>
			<v-btn icon="mdi-send" label="Отправить" class="ml-3" @click="createTextMessage"></v-btn>
		</div>
		<AttachDialog v-model="dialog" :preview-src="previewSrc" @submit="createAttachment" @close="previewSrc = ''" />
	</div>
</template>

<script setup>
import AttachMenu from '@/components/message/AttachMenu.vue';
import AttachDialog from '@/components/message/AttachDialog.vue';
import { ref, reactive } from 'vue';

const emit = defineEmits(['submitForm']);

const dialog = ref(false);
const previewSrc = ref('');
const file = ref();
const messageState = reactive({
	text: '',
});

const createTextMessage = () => {
	if (messageState.text) {
		emit('submitForm', {
			text: messageState.text
		}, 'text');
		messageState.text = '';
	}
};
const createAttachment = content => {
	emit('submitForm', {
		...content,
		image: file.value || null,
	}, 'media');
};
const attachFile = e => {
	const files = e.target.files || e.dataTransfer.files;
	if (!files.length)
		return;
	file.value = files[0];
	const reader = new FileReader();
	reader.onload = () => previewSrc.value = reader.result;
	reader.onerror = e => console.error(e);
	reader.readAsDataURL(file.value);
	e.target.value = '';
	dialog.value = true;
};
</script>

<style lang="scss" scoped>
</style>