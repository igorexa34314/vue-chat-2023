<template>
	<v-container class="container" fluid>
		<div v-if="userChats && userChats.length && !userChats.some(el => el === $route.params.id)" class="text-h5 pa-5">
			Такого чата не существует либо вы не состоите в нем</div>
		<div v-else-if="userChats && userChats.length" style="height: 100%; position: relative;">
			<div v-if="loading"><page-loader /></div>
			<div v-else-if="messages && messages.length" class="chat__content px-12" ref="chatEl">
				<div class="messages-field mt-4">
					<!-- <TransitionGroup name="messages-list"> -->
					<MessageItem v-for="m in messages" :key="m.id" :self="uid === m.sender.id" :type="m.type"
						:content="m.content" :sender="m.sender" :created_at="m.created_at" />
					<!-- </TransitionGroup> -->
				</div>
				<!-- <div v-if="!messages || !messages.length" class="text-h5 pa-4">Сообщений в чате пока нет</div> -->
			</div>
			<MessageForm class="message-form py-4 px-6" @submitForm="createMessage" />
		</div>
	</v-container>
</template>

<script setup>
import pageLoader from '@/components/UI/pageLoader.vue';
import MessageItem from '@/components/message/MessageItem.vue';
import MessageForm from '@/components/message/MessageForm.vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { useMessagesStore } from '@/stores/messages';
import { useCurrentUser } from 'vuefire';
import { useChat } from '@/composables/chat';
import { ref, computed, onUnmounted, watchEffect, inject } from 'vue';
import { useMeta } from 'vue-meta';
import { useRoute } from 'vue-router';
import { useInfiniteScroll, watchPausable } from '@vueuse/core';


const route = useRoute();
const { getChatInfoById } = useChat();
const { showMessage } = useSnackbarStore();
const chatInfo = ref({});
const messagesStore = useMessagesStore();
const userChats = inject('userChats');
const chatEl = ref(null);
const loading = ref(true);
const messages = computed(() => messagesStore.messages);
const lastVisible = computed(() => messagesStore.lastVisible);
let unsubscribe;

const uid = useCurrentUser().value.uid;

// Hide scroll when it's inactive
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

// Watchers to scroll bottom
const scrollBottom = () => {
	if (chatEl.value && chatEl.value.scrollHeight > chatEl.value.clientHeight && chatEl.value.scrollHeight)
		chatEl.value.scrollTop = chatEl.value.scrollHeight;
};
const { pause: pauseMessageWatcher, resume: resumeMessageWatcher } = watchPausable(messages, () => {
	scrollBottom();
}, { deep: true, flush: 'post' });

// Inf. scroll on top
useInfiniteScroll(chatEl, async () => {
	if (lastVisible.value.top) {
		pauseMessageWatcher();
		await messagesStore.loadMoreChatMessages(route.params.id, 'top');
		resumeMessageWatcher();
	}
}, { distance: 10, direction: 'top', preserveScrollPosition: true, }
);

// Inf. scroll on bottom
useInfiniteScroll(chatEl, async () => {
	if (lastVisible.value.bottom) {
		pauseMessageWatcher();
		await messagesStore.loadMoreChatMessages(route.params.id, 'bottom');
		resumeMessageWatcher();
	}
}, { distance: 10, direction: 'bottom', preserveScrollPosition: false, }
);

// Reset messages when switching chat
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

//Dynamic page title
useMeta(computed(() => {
	if (Object.keys(chatInfo.value).length)
		return { title: chatInfo.value.type === 'private' ? chatInfo.value.opponent.displayName : chatInfo.value.name };
	return { title: 'Чат' };
}));

// Unsubscribe from receiving messages realtime firebase
onUnmounted(() => {
	messagesStore.clearMessages();
	if (unsubscribe) unsubscribe();
});

const createMessage = async (content, type = 'text') => {
	try {
		await messagesStore.createMessage({
			chatId: route.params.id,
			type,
			content,
		});
	} catch (e) {
		showMessage(messages[e] || e, 'red-darken-3', 2000);
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
	bottom: 82px;
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
	transition: all 0.35s ease-in;
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