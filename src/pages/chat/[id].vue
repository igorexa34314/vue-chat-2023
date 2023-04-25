<template>
	<v-container class="container" fluid>
		<div v-if="userChats && userChats.length && !userChats.some(el => el === $route.params.id)" class="text-h5 pa-5">
			Такого чата не существует либо вы не состоите в нем</div>
		<div v-else-if="userChats && userChats.length" style="height: 100%; position: relative;" @dragenter="addAttachment"
			@dragleave="removeAttachment" class="chat__field">
			<div v-if="loading"><page-loader /></div>
			<!-- <div v-else-if="!messages || !messages.length" class="text-h5 pa-4">Сообщений в чате пока нет</div> -->
			<div v-else-if="messages && messages.length" ref="chatEl" class="chat__content px-6">
				<div class="messages-field mt-4" draggable="false">
					<!-- <TransitionGroup :name="enTransition ? 'messages-list' : ''"> -->
					<MessageItem v-for="m in messages" :key="m.id" :self="uid === m.sender.id" :type="m.type"
						:content="m.content" :sender="m.sender" :created_at="<Date>m.created_at"
						@contextmenu.prevent="openCtxMenu(m.id, $event)" :id="`message-${m.id}`" :data-message-id="m.id"
						draggable="false" class="message-item" @blur="closeCtxMenu" @open-in-overlay="openInOverlay"
						@media-loaded="addMediaPreviewToOverlay" />
					<!-- </TransitionGroup> -->
					<ContextMenu v-model="msgCtxMenu.show" :position="msgCtxMenu.position" />
					<FullsizeOverlay v-model="overlayState.show" :content="<ImageWithPreviewURL[]>overlayState.images"
						v-model:currentItem="overlayState.currentImage" @close="overlayClosed" />
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
import FullsizeOverlay from '@/components/chat/messages/media/FullsizeOverlay.vue';
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
import { ref, reactive, computed, watchEffect, onUnmounted, nextTick } from 'vue';
import { useMeta } from 'vue-meta';
import { useRoute } from 'vue-router';
import { useChatScroll } from '@/composables/useChatScroll';
import { useDropZone } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { setChatName } from '@/utils/chat';
import type { Unsubscribe } from '@firebase/database';
import type { MediaMessage, Message } from '@/stores/messages';
import type { ChatInfo } from '@/services/chat';
import type { TextMessage } from '@/types/db/MessagesTable';
import type { VMenu, VDialog } from 'vuetify/components';
import type { AttachFormContent } from '@/services/message';
import type { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';

const { getUChats: userChats } = storeToRefs(useUserdataStore());
const route = useRoute();
const { showMessage } = useSnackbarStore();
const messagesStore = useMessagesStore();
const { $reset } = messagesStore;

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
	$reset();
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
		$reset();
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
const msgCtxMenu = reactive({
	show: false,
	position: { x: 0, y: 0 }
});
const openCtxMenu = (mId: Message['id'], e: MouseEvent) => {
	msgCtxMenu.show = false;
	msgCtxMenu.position.x = e.clientX;
	msgCtxMenu.position.y = e.clientY;
	(e.target as HTMLElement).style.backgroundColor = "rgba(255, 255, 255, 0.2)";
	nextTick(() => msgCtxMenu.show = true);
};
const closeCtxMenu = () => console.log('closeCtxMenu');
// Unsubscribe from receiving messages realtime firebase
onUnmounted(() => {
	$reset();
	unsub?.();
});

const overlayState = reactive({
	show: false,
	images: [] as ImageWithPreviewURL[],
	currentImage: 0,
});
const addMediaPreviewToOverlay = (media: ImageWithPreviewURL) => {
	overlayState.images.push(media);
};
const openInOverlay = (imgId: ImageWithPreviewURL['id']) => {
	overlayState.currentImage = overlayState.images.findIndex(img => img.id == imgId);
	overlayState.show = true;
}
const overlayClosed = () => {
};
</script>

<style lang="scss" scoped>
// Custom scroll
$scroll-bg: v-bind(scrollOpacity) !important;
@import "@/assets/styles/scroll";

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

.message-item {
	transition: all 0.25s ease-in 0s;
	&._context {
		background-color: rgba(255, 255, 255, 0.2);
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