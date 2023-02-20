<template>
	<v-container class="container" fluid>
		<div style="height: 100%; position: relative;">
			<div class="chat__content px-12" ref="chat">
				<div class="messages-field" v-if="messages">
					<TransitionGroup name="messages-list">
						<MessageItem v-for="m in messages" :key="m.id" :self="uid === m.sender.id" :textContent="m.content.text"
							:sender="m.sender" :time="$d(m.created_at, 'message', 'uk-UA')" />
					</TransitionGroup>
				</div>
			</div>
			<MessageForm class="message-form pa-4" @submitForm="createMessage" />
		</div>
	</v-container>
</template>

<script setup>
import MessageItem from '@/components/MessageItem.vue';
import MessageForm from '@/components/MessageForm.vue';
import { useMessagesStore } from '@/stores/messages';
import { useCurrentUser } from 'vuefire';
import { useChatStore } from '@/stores/chat';
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useMeta } from 'vue-meta';
import { useRoute } from 'vue-router';

const route = useRoute();
const messagesStore = useMessagesStore();
const { getChatMembers } = useChatStore();
const chat = ref();
const members = ref([]);

onMounted(async () => {
	const chatId = route.params.id;
	members.value = await getChatMembers(chatId);
	await messagesStore.fetchChatMessages(chatId);
});
onUnmounted(() => messagesStore.clearMessages);

const messages = computed(() => messagesStore.messages);
watch(messages.value, () => {
	setTimeout(() => chat.value.scrollTop = chat.value.scrollHeight, 0);
});
const uid = useCurrentUser().value.uid;

useMeta({ title: route.params.id });

const createMessage = async messageText => {
	await messagesStore.createMessage({
		chatId: route.params.id,
		content: {
			text: messageText,
		},
	});
};
</script>

<style lang="scss" scoped>
.container {
	padding: 0 !important;
	height: 100%;
}
.chat__content {
	position: absolute;
	bottom: 60px;
	top: 0;
	left: 0;
	right: 0;
	overflow: auto;
}
.message-form {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
}
.messages-field {}
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

<route lang="yaml">
meta:
  requiresAuth: true 
</route>