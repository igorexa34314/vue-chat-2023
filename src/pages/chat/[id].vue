<template>
	<v-container class="container" fluid>
		<div v-if="userChats && userChats.length && !userChats.some(el => el === $route.params.id)" class="text-h5 pa-5">
			Такого чата не существует либо вы не состоите в нем</div>
		<div v-else-if="userChats && userChats.length" style="height: 100%; position: relative;" @dragenter="addAttachment"
			@dragleave="removeAttachment" class="chat__field">
			<div v-if="loading"><page-loader /></div>
			<!-- <div v-else-if="!messages || !messages.length" class="text-h5 pa-4">Сообщений в чате пока нет</div> -->
			<div v-else-if="messages && messages.length" ref="chatEl" class="chat__content px-8">
				<div class="messages-field mt-4" draggable="false">
					<TransitionGroup :name="enTransition ? 'messages-list' : ''">
						<MessageItem v-for="m in messages" :key="m.id" :self="uid === m.sender.id" :type="m.type"
							:content="m.content" :sender="m.sender" :created_at="<Date>m.created_at"
							@contextmenu.prevent="openCtxMenu" :id="`message-${m.id}`" :data-message-id="m.id"
							draggable="false" />
					</TransitionGroup>
					<ContextMenu v-model="msgCtxMenu.show" :position="msgCtxMenu.position" ref="ctxMenu" />
				</div>
			</div>
			<Transition name="fixed-btn-fade">
				<v-btn v-if="chatEl && chatEl.scrollHeight > chatEl.clientHeight && !isScrollOnBottom"
					class="fixed-button-scrolldown" color="blue-grey-darken-1" icon="mdi-arrow-down" size="large"
					@click="scrollBottom('smooth')" />
			</Transition>
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
import sbMessages from '@/utils/messages.json';
import MessageItem from '@/components/chat/messages/MessageItem.vue';
import MessageForm from '@/components/chat/form/MessageForm.vue';
import ContextMenu from '@/components/chat/ContextMenu.vue';
import { fetchChatMessages } from '@/services/message';
import { useSnackbarStore } from '@/stores/snackbar';
import { useUserdataStore } from '@/stores/userdata';
import { useMessagesStore } from '@/stores/messages';
import { useCurrentUser } from 'vuefire';
import { getChatInfoById } from '@/services/chat';
import { createMessage as createDBMessage } from '@/services/message';
import { ref, reactive, computed, watchEffect, onUnmounted } from 'vue';
import { useMeta } from 'vue-meta';
import { useRoute } from 'vue-router';
import { useChatScroll } from '@/composables/useChatScroll';
import { useDropZone } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { setChatName } from '@/utils/chat';
import type { Unsubscribe } from '@firebase/database';
import type { Message } from '@/stores/messages';
import type { ChatInfo } from '@/services/chat';
import type { TextMessage } from '@/types/db/MessagesTable';
import type { VDialog } from 'vuetify/components';
import type { ComponentPublicInstance } from 'vue';
import type { AttachFormContent } from '@/services/message';

const { getUChats: userChats } = storeToRefs(useUserdataStore());
const route = useRoute();
const { showMessage } = useSnackbarStore();
const messagesStore = useMessagesStore();
const { clearMessages } = messagesStore;

const chatInfo = ref<ChatInfo>();
const chatEl = ref<HTMLDivElement>();
const loading = ref(true);
const messages = computed(() => messagesStore.messages);
let unsub: Unsubscribe | undefined;
let chatId = route.params.id as string;
const uid = useCurrentUser().value?.uid;

const attachDialog = ref(false);
const dropZone = ref<VDialog | HTMLElement>();

const { scrollOpacity, isScrollOnBottom, scrollBottom } = useChatScroll(chatId, chatEl, messages);

// const { isOverDropZone } = useDropZone(dropZone.value as HTMLElement, (files) => {
// 	console.log('droppped', files)
// });

//Dynamic page title
useMeta(computed(() => {
	if (chatInfo.value && Object.keys(chatInfo.value).length)
		return { title: setChatName.value(chatInfo.value) };
	else return { title: 'Чат' };
}));

const addAttachment = () => {
	console.log('Drag enter');
	attachDialog.value = true;
};
const removeAttachment = () => {
	console.log('Drag leave');
	attachDialog.value = false;
};

// Reset messages when switching chat
watchEffect(async (onCleanup) => {
	clearMessages();
	chatId = route.params.id as string;
	unsub?.();
	if (chatId) {
		try {
			loading.value = true;
			chatInfo.value = await getChatInfoById(chatId);
			unsub = await fetchChatMessages(chatId);
		} catch (e) {
			console.error(e);
		}
		finally {
			loading.value = false;
		}
	}
	// Unsubscribe from receiving messages realtime firebase
	onCleanup(() => {
		clearMessages();
		unsub?.();
	});
});

const enTransition = ref(false);

const createMessage = async (content: TextMessage | AttachFormContent, type: Message['type'] = 'text') => {
	try {
		enTransition.value = true;
		await createDBMessage(chatId, type, content);
	} catch (e) {
		showMessage(sbMessages[e as keyof typeof sbMessages] || e as string, 'red-darken-3', 2000);
	}
	finally {
		enTransition.value = false;
	}
};

// Context menu on message right click
const ctxMenu = ref<InstanceType<typeof ContextMenu>>();
const msgCtxMenu = reactive({
	show: false,
	activator: '' as string | Element | ComponentPublicInstance | undefined,
	position: { x: 0, y: 0 }
});
const openCtxMenu = (e: MouseEvent) => {
	msgCtxMenu.show = true;
	ctxMenu.value?.updateLocation?.(e);
};

// Unsubscribe from receiving messages realtime firebase
onUnmounted(() => {
	clearMessages();
	unsub?.();
});
</script>

<style lang="scss" scoped>
.container {
	padding: 0 !important;
	height: 100%;
}
.chat__field {}
.chat__content {
	position: absolute;
	bottom: 82px;
	top: 0;
	left: 0;
	right: 0;
	overflow: auto;
}
.message-form {
	margin-left: auto;
	margin-right: auto;
	max-width: 1080px;
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
}
.messages-field {
	margin: 0 auto;
	max-width: 1080px;
}
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
	background-color: v-bind(scrollOpacity);
	border-radius: 0.5rem;
	transition: all 0.35s ease-in 0s;
	&:hover {
		background-color: rgba($color: #ffffff, $alpha: .4);
		transition: all 0.35s ease-in 0s;
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
.fixed-button-scrolldown {
	position: absolute;
	bottom: 102px;
	right: 5%;
	z-index: 100;
}
.fixed-btn-fade-enter-active,
.fade-leave-active {
	transition: opacity 0.5s ease;
}

.fixed-btn-fade-enter-from,
.fixed-btn-fade-leave-to {
	opacity: 0;
}
</style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>