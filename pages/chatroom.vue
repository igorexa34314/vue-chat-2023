<template>
	<v-container class="container pt-6">
		<div class="chat__content mb-10">
			<div class="messages-field">
				<TransitionGroup name="messages-list">
					<MessageItem v-for="m in messagesStore.getAllMessages" :key="m.id" :textContent="m.textContent"
						:sender="m.user" />
				</TransitionGroup>
			</div>
			<MessageForm class="message-form" @submitForm="createMessage" />
		</div>
	</v-container>
</template>

<script setup>
import { useMessagesStore } from '@/stores/messages';
import { v4 as uuidv4 } from 'uuid';

definePageMeta({ layout: 'default' })

const messagesStore = useMessagesStore();

const createMessage = messageText => {
	messagesStore.addMessage({
		id: uuidv4(),
		user: 'Igor Kononenko',
		textContent: messageText,
		date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
	})
};
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
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
}

.messages-list-enter-active,
.messages-list-leave-active {
	transition: all 0.5s ease;
}
.messages-list-enter-from,
.messages-list-leave-to {
	opacity: 0;
	transform: translateX(30px);
}
</style>