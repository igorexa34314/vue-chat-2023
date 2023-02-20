<template>
	<v-container class="container pt-6">
		<div v-if="messages">
			<h2 class="mb-5">Страница чата </h2>
			<div class="chat__content mb-10">
				<div class="messages-field">
					<TransitionGroup name="messages-list">
						<MessageItem v-for="m in messages" :key="m.id" :own="uid === m.sender.id" :textContent="m.content.text"
							:sender="m.sender" />
					</TransitionGroup>
				</div>
			</div>
		</div>
		<MessageForm class="message-form" @submitForm="createMessage" />
	</v-container>
</template>

<script setup>
import MessageItem from '@/components/MessageItem.vue';
import MessageForm from '@/components/MessageForm.vue';
import { useChatStore } from '@/stores/chat';
import { useCurrentUser } from 'vuefire'
import { useMessagesStore } from '@/stores/messages';
import { useUserdataStore } from '@/stores/userdata';
import { useAuthStore } from '@/stores/auth';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMeta } from 'vue-meta';
import { useRoute } from 'vue-router';

const route = useRoute();
const { getUid } = useAuthStore();
// const chat = useChatStore();
const messagesStore = useMessagesStore();
const userdataStore = useUserdataStore();
const interloc = ref();
const uid = await getUid();

onMounted(async () => {
	await messagesStore.fetchChatMessages(route.params.id);
});
onUnmounted(() => messagesStore.clearMessages);
const messages = computed(() => messagesStore.messages);

const user = computed(() => userdataStore.userdata);

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

<route lang="yaml">
meta:
  requiresAuth: true 
</route>