<template>
	<v-container class="container" fluid>
		<div v-if="userChats && userChats.length && !userChats.some(el => el === $route.params.id)" class="text-h5 pa-5">
			Такого чата не существует либо вы не состоите в нем</div>
		<div v-else-if="userChats && userChats.length" style="height: 100%; position: relative;">
			<div v-if="loading"><page-loader /></div>
			<div v-else-if="messages && messages.length" class="chat__content px-12" ref="chat">
				<div class="messages-field mt-4">
					<div v-if="lastVisible" v-intersect.quiet="onIntersect" class="observer"
						style="visibility: hidden; height: 1em; margin-top: -1.2rem;">
					</div>
					<TransitionGroup name="messages-list">
						<MessageItem v-for="m in messages" :key="m.id" :self="uid === m.sender.id" :textContent="m.content.text"
							:sender="m.sender" :time="m.created_at" />
					</TransitionGroup>
				</div>
				<!-- <div v-if="!messages || !messages.length" class="text-h5 pa-4">Сообщений в чате пока нет</div> -->
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
const { getChatInfoById } = useChat();
const chatInfo = ref({});
const messagesStore = useMessagesStore();
const userChats = inject('userChats');
const chat = ref();
const loading = ref(true);
const messages = computed(() => messagesStore.messages);
const lastVisible = computed(() => messagesStore.lastVisible);
let unsubscribe;

const uid = useCurrentUser().value.uid;

// let time;
// const scrollVisibility = ref('hidden');
// const showScroll = () => {
// 	scrollVisibility.value = 'visible';
// 	if (!time) {
// 		time = setTimeout(() => {
// 			scrollVisibility.value = 'hidden';
// 			console.log('timeout');
// 		}, 1000);
// 	}
// };

watchEffect(async () => {
	messagesStore.clearMessages();
	if (unsubscribe) {
		unsubscribe();
	}
	if (route.params && route.params.id) {
		loading.value = true;
		chatInfo.value = await getChatInfoById(route.params.id);
		unsubscribe = await messagesStore.fetchChatMessages(route.params.id);
		loading.value = false;
	}
});
useMeta(computed(() => {
	if (Object.keys(chatInfo.value).length)
		return { title: chatInfo.value.type === 'private' ? chatInfo.value.opponent.displayName : chatInfo.value.name };
	return { title: 'Чат' };
}));
watch(messages, () => {
	if (chat.value) {
		setTimeout(() => chat.value.scrollTop = chat.scrollHeight, 0);
	}
}, { deep: true, flush: 'post' });

watchEffect(() => {
	if (chat.value && messages.value.length) {
		setTimeout(() => chat.value.scrollTop = (chat.value.scrollHeight / messages.value.length) * ((messages.value.length % 10) || 10), 0);
	}
}, { flush: 'post' });

onUnmounted(() => {
	messagesStore.clearMessages();
	if (unsubscribe) unsubscribe();
});

const createMessage = async messageText => {
	await messagesStore.createMessage({
		chatId: route.params.id,
		content: {
			text: messageText,
		},
	});
};

const onIntersect = async (isIntersecting, entries, obs) => {
	if (isIntersecting && lastVisible.value) {
		await messagesStore.loadMoreChatMessages(route.params.id)
	}
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
/* width */
::-webkit-scrollbar {
	width: 0.55rem;
}

/* Track */
::-webkit-scrollbar-track {
	border-radius: 0.5rem;
}

/* Handle */
::-webkit-scrollbar-thumb {
	// visibility: v-bind('scrollVisibility');
	background-color: rgba($color: #ffffff, $alpha: .2);
	border-radius: 0.5rem;
	transition: all 0.35s ease-in 0s;
	&:hover {
		background-color: rgba($color: #ffffff, $alpha: .4);
	}
}
</style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>