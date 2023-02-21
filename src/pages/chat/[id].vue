<template>
	<v-container class="container" fluid>
		<div v-if="userChats && userChats.length && !userChats.some(el => el === $route.params.id)" class="text-h5 pa-5">
			Такого чата не существует либо вы не состоите в нем</div>
		<div v-else-if="userChats && userChats.length" style="height: 100%; position: relative;">
			<div v-if="!messages"><page-loader /></div>
			<div v-else-if="messages && messages.length" class="chat__content px-12" ref="chat">
				<div class="messages-field mt-4" v-if="messages && messages.length">
					<TransitionGroup name="messages-list">
						<MessageItem v-for="m in messages" :key="m.id" :self="uid === m.sender.id" :textContent="m.content.text"
							:sender="m.sender" :time="$d(m.created_at, 'message', 'uk-UA')" />
					</TransitionGroup>
				</div>
				<div v-else>Сообщений в чате пока нет</div>
			</div>
			<MessageForm class="message-form pa-4" @submitForm="createMessage" />
		</div>
	</v-container>
</template>

<script setup>
import pageLoader from '@/components/UI/pageLoader.vue';
import MessageItem from '@/components/MessageItem.vue';
import MessageForm from '@/components/MessageForm.vue';
import { useMessagesStore } from '@/stores/messages';
import { useCurrentUser } from 'vuefire';
import { useChat } from '@/composables/chat';
import { ref, computed, onUnmounted, watch, watchEffect, inject } from 'vue';
import { useMeta } from 'vue-meta';
import { useRoute } from 'vue-router';

const route = useRoute();
const messagesStore = useMessagesStore();
const { getChatMembers } = useChat();
const userChats = inject('userChats');
const chat = ref();
const members = ref([]);
const messages = computed(() => messagesStore.messages);

useMeta({ title: route.params.id });
const uid = useCurrentUser().value.uid;

watchEffect(async () => {
	messagesStore.clearMessages();
	await messagesStore.fetchChatMessages(route.params.id);
	members.value = await getChatMembers(route.params.id);
});

watch(messages, () => {
	if (chat.value) {
		setTimeout(() => chat.value.scrollTop = chat.value.scrollHeight, 0);
	}
}, { deep: true });

onUnmounted(() => messagesStore.clearMessages());

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