<template>
	<v-container class="container">
		<div class="chat__content">
			<div class="messages-field">
				<MessageItem v-for="m in messages.getAllMessages" :key="m.id" :textContent="m.textContent"
					:sender="m.user" />
			</div>
			<MessageForm class="message-form" @submitForm="createMessage" />
		</div>
	</v-container>
</template>

<script>
import { useMessagesStore } from '@/stores/messages';
import { v4 as uuidv4 } from 'uuid';

// definePageMeta({ layout: 'default' })
export default {
	setup() {
		const messagesStore = useMessagesStore();
		const createMessage = messageText => {
			messagesStore.addMessage({
				id: uuidv4(),
				user: 'Igor Kononenko',
				textContent: messageText,
				date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
			})
		};
		return {
			messages: messagesStore, createMessage,
		}
	}
}
</script>

<style lang="scss" scoped>
.container {
	min-height: calc(100vh - 64px);
	display: flex;
	flex-direction: column;
}
.chat__content {
	flex: 1 1 auto;
	position: relative;
}
.message-form {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
}
</style>