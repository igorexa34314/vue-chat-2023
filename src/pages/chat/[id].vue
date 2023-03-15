<template>
	<v-container class="container" fluid>
		<div v-if="userChats && userChats.length && !userChats.some(el => el === $route.params.id)" class="text-h5 pa-5">
			Такого чата не существует либо вы не состоите в нем</div>
		<div v-else-if="userChats && userChats.length" style="height: 100%; position: relative;" @dragenter="addAttachment"
			@dragleave="removeAttachment">
			<div v-if="loading"><page-loader /></div>
			<div v-else-if="messages && messages.length" ref="chatEl" class="chat__content px-12">
				<div class="messages-field mt-4">
					<TransitionGroup :name="enTransition ? 'messages-list' : ''">
						<MessageItem v-for="m in messages" :key="m.id" :self="uid === m.sender.id" :type="m.type"
							:content="m.content" :sender="m.sender" :created_at="<Date>m.created_at" />
					</TransitionGroup>
				</div>
				<!-- <div v-if="!messages || !messages.length" class="text-h5 pa-4">Сообщений в чате пока нет</div> -->
			</div>
			<MessageForm class="message-form py-4 px-6" @submitForm="createMessage" />
		</div>
		<v-dialog v-model="attachDialog" width="auto" ref="dropZone">
			<v-card minHeight="80vh" minWidth="80vh" class="bg-blue-accent-1 d-flex flex-column align-center justify-center"
				style="position: reactive; left: 25%">
				<div class="attach-frame text-h4 ma-6 font-weight-bold">
					Прикрепите файлы
				</div>
			</v-card>
		</v-dialog>
	</v-container>
</template>

<script setup lang="ts">
import MessageItem from '@/components/chat/MessageItem.vue';
import MessageForm from '@/components/chat/MessageForm.vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { useUserdataStore } from '@/stores/userdata';
import { AttachFormContent, useMessagesStore } from '@/stores/messages';
import { useCurrentUser } from 'vuefire';
import { useChat } from '@/composables/chat';
import { ref, computed, watchEffect } from 'vue';
import { useMeta } from 'vue-meta';
import { useRoute } from 'vue-router';
import { useInfiniteScroll, watchPausable } from '@vueuse/core';
import { useDropZone } from '@vueuse/core';
import type { Unsubscribe } from '@firebase/database';
import type { Message, LastVisibleFbRef } from '@/stores/messages';
import type { ChatInfo } from '@/composables/chat';
import type { TextMessage } from '@/types/db/MessagesTable';
import type { VDialog } from 'vuetify/components';
import { storeToRefs } from 'pinia';

const { getUChats: userChats } = storeToRefs(useUserdataStore());
const route = useRoute();
const { getChatInfoById, setChatName } = useChat();
const { showMessage } = useSnackbarStore();
const messagesStore = useMessagesStore();

const chatInfo = ref<ChatInfo>();
const chatEl = ref<HTMLDivElement>();
const loading = ref(true);
const messages = computed<Message[]>(() => messagesStore.messages);
const lastVisible = computed<LastVisibleFbRef>(() => messagesStore.lastVisible);
let unsubscribe: Unsubscribe;

const uid = useCurrentUser().value?.uid;
let chatId = route.params.id as string;

const attachDialog = ref(false);
const dropZone = ref<VDialog | HTMLElement>();

const { isOverDropZone } = useDropZone(dropZone.value as HTMLElement, (files) => {
	console.log('droppped', files)
});
const addAttachment = () => {
	console.log('Drag enter');
	attachDialog.value = true;
};
const removeAttachment = () => {
	console.log('Drag leave');
	attachDialog.value = false;
};

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
const { pause: pauseMessageWatcher, resume: resumeMessageWatcher } = watchPausable(messages, () => {
	if (chatEl.value && chatEl.value.scrollHeight > chatEl.value.clientHeight && chatEl.value.scrollHeight)
		chatEl.value.scrollTop = chatEl.value.scrollHeight;
}, { deep: true, flush: 'post' });

// Inf. scroll on top
useInfiniteScroll(chatEl, async () => {
	if (lastVisible.value.top) {
		pauseMessageWatcher();
		await messagesStore.loadMoreChatMessages(chatId, 'top');
		resumeMessageWatcher();
	}
}, { distance: 10, direction: 'top', preserveScrollPosition: true, }
);

// Inf. scroll on bottom
useInfiniteScroll(chatEl, async () => {
	if (lastVisible.value.bottom) {
		pauseMessageWatcher();
		await messagesStore.loadMoreChatMessages(chatId, 'bottom');
		resumeMessageWatcher();
	}
}, { distance: 10, direction: 'bottom', preserveScrollPosition: false, }
);

// Reset messages when switching chat
watchEffect(async (onCleanup) => {
	messagesStore.clearMessages();
	chatId = route.params.id as string;
	unsubscribe?.();
	if (chatId) {
		loading.value = true;
		chatInfo.value = await getChatInfoById(chatId);
		unsubscribe = await messagesStore.fetchChatMessages(chatId);
		loading.value = false;
	}
	// Unsubscribe from receiving messages realtime firebase
	onCleanup(() => {
		messagesStore.clearMessages();
		unsubscribe?.();
	});
});

//Dynamic page title
useMeta(computed(() => {
	if (chatInfo.value && Object.keys(chatInfo.value).length)
		return { title: setChatName.value(chatInfo.value) };
	else return { title: 'Чат' };
}));
const enTransition = ref(false);

const createMessage = async (content: TextMessage | AttachFormContent, type: Message['type'] = 'text') => {
	enTransition.value = true;
	try {
		await messagesStore.createMessage(chatId, type, content);
	} catch (e) {
		showMessage(messages[e] || e, 'red-darken-3', 2000);
	}
	enTransition.value = false;
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
.attach-frame {
	width: 90%;
	flex: 1;
	border: 3px dashed #1A237E;
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>