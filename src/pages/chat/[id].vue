<template>
	<v-container class="container" fluid>
		<div v-if="userChats && userChats.length && !userChats.some(el => el === $route.params.id)" class="text-h5 pa-5">
			Такого чата не существует либо вы не состоите в нем</div>
		<div v-else-if="userChats && userChats.length" style="height: 100%; position: relative;" class="chat__field">
			<div v-if="loading"><page-loader /></div>
			<!-- <div v-else-if="!messages || !messages.length" class="text-h5 pa-4">Сообщений в чате пока нет</div> -->
			<div v-else-if="messages && messages.length" ref="chatEl" class="chat__content px-4">
				<div class="messages-field mt-4">
					<TransitionGroup :name="enTransition ? 'messages-list' : ''">
						<MessageItem v-for="m in messages" :key="m.id" :self="uid === m.sender.id" :type="m.type"
							:content="m.content" :sender="m.sender" :created_at="<Date>m.created_at"
							:class="{ '_context': msgCtxMenu.activeMessage === m.id }"
							@contextmenu="(e: MouseEvent) => openCtxMenu(e, { mId: m.id, mType: m.type })" :id="`message-${m.id}`"
							:data-message-id="m.id" class="message-item" @open-in-overlay="openInOverlay" @dragstart.prevent
							@drop.prevent draggable="false" />
					</TransitionGroup>
					<ContextMenu v-model="msgCtxMenu.show" :content-type="msgCtxMenu.contentType"
						:position="msgCtxMenu.position" @closed="ctxMenuClosed" @copy-selected="copySelectedText"
						@copy-image="copyImage" @copy-all="copyTextMessage" @download="downloadFile" @edit="editMessage" />
					<FullsizeOverlay v-model="overlayState.show" :content="<ImageWithPreviewURL[]>getAllMedia"
						v-model:currentItem="overlayState.currentImage" @close="overlayClosed" />
				</div>
			</div>
			<Transition name="fixed-btn-fade">
				<v-btn v-if="chatEl && chatEl.scrollHeight > chatEl.clientHeight && !isScrollOnBottom"
					class="fixed-button-scrolldown" color="blue-grey-darken-1" :icon="mdiArrowDown" size="large"
					@click="scrollBottom('smooth')" />
			</Transition>
			<MessageForm class="message-form py-4 px-6" ref="msgForm" @create-message="createMessage"
				@update-message="updateMessage" @scroll-to-message="highlightMessage" />
		</div>
		<!-- <v-dialog v-model="attachDialog" width="auto" ref="dropZone">
			<v-card minHeight="80vh" minWidth="80vh" class="bg-blue-accent-1 d-flex flex-column align-center justify-center"
				style="position: reactive; left: 25%">
				<div class="attach-frame text-h4 ma-6 font-weight-bold">
					Прикрепите файлы
				</div>
			</v-card>
		</v-dialog> -->
	</v-container>
</template>

<script setup lang="ts">
import { mdiArrowDown } from '@mdi/js';
import FullsizeOverlay from '@/components/chat/messages/media/FullsizeOverlay.vue';
import sbMessages from '@/utils/messages.json';
import MessageItem from '@/components/chat/messages/MessageItem.vue';
import MessageForm, { EditMessageData } from '@/components/chat/form/MessageForm.vue';
import ContextMenu from '@/components/chat/ContextMenu.vue';
import { fetchChatMessages, AttachFormContent } from '@/services/message';
import { useSnackbarStore } from '@/stores/snackbar';
import { useUserdataStore } from '@/stores/userdata';
import { useMessagesStore, Message } from '@/stores/messages';
import { useCurrentUser } from 'vuefire';
import { getChatInfoById, ChatInfo } from '@/services/chat';
import { createMessage as createDBMessage, updateMessageContent as updateDBMessageContent } from '@/services/message';
import { ref, watch, reactive, computed, watchEffect, onUnmounted, nextTick } from 'vue';
import { useMeta } from 'vue-meta';
import { useRoute } from 'vue-router';
import { useChatScroll } from '@/composables/useChatScroll';
import { loadMoreChatMessages } from '@/services/message';
import { useDropZone } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { setChatName } from '@/utils/chat';
import { downloadFile as downloadFileProcess } from '@/utils/message/fileActions';
import { copyToClipboard as copyImageToClipboard } from '@/utils/message/imageActions';
import { Unsubscribe } from '@firebase/database';
import { VDialog } from 'vuetify/components';
import { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';

const { getUChats: userChats } = storeToRefs(useUserdataStore());
const route = useRoute();
const { showMessage } = useSnackbarStore();
const messagesStore = useMessagesStore();
const { $reset: resetMsgStore } = messagesStore;

const chatInfo = ref<ChatInfo>();
const chatEl = ref<HTMLDivElement>();
const loading = ref(false);
const messages = computed(() => messagesStore.messages);
let unsub: Unsubscribe | undefined;
let chatId = route.params.id as string;
const uid = useCurrentUser().value?.uid;

const attachDialog = ref(false);
const dropZone = ref<VDialog | HTMLElement>();

// Using chat scroll composable with infinite scroll
const { isScrolling, scrollOpacity, isScrollOnBottom, scrollBottom } = useChatScroll(chatEl, {
	onLoadMore: async (direction) => {
		await loadMoreChatMessages(chatId, direction);
	}
});

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
	resetMsgStore();
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
		resetMsgStore();
		unsub?.();
	});
});

const enTransition = ref(false);
const createMessage = async (type: Message['type'] = 'text', content: Partial<AttachFormContent>) => {
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
const updateMessage = async ({ id, type, content }: EditMessageData) => {
	try {
		await updateDBMessageContent(chatId, { id, type, content });
	} catch (e) {
		showMessage(sbMessages[e as keyof typeof sbMessages] || e as string, 'red-darken-3', 2000);
	}
};

// Context menu on message right click
const msgCtxMenu = reactive({
	show: false,
	contentType: 'text' as Message['type'],
	position: { x: 0, y: 0 },
	activeMessage: '' as Message['id']
});
const openCtxMenu = (e: MouseEvent, { mId, mType }: { mId: Message['id']; mType?: Message['type'] }) => {
	msgCtxMenu.activeMessage = mId;
	msgCtxMenu.show = false;
	msgCtxMenu.position.x = e.clientX;
	msgCtxMenu.position.y = e.clientY;
	msgCtxMenu.contentType = mType || 'text';
	nextTick().then(() => msgCtxMenu.show = true);
};
const ctxMenuClosed = () => { msgCtxMenu.activeMessage = '' };
// Unsubscribe from receiving messages realtime firebase
onUnmounted(() => {
	resetMsgStore();
	unsub?.();
});
const getAllMedia = computed(() => messages.value.filter(m => m.type !== 'text').flatMap(m => m.content.attachments.filter(f => f.raw?.previewURL)));
const overlayState = reactive({
	show: false,
	currentImage: 0,
});
const openInOverlay = (imgId: ImageWithPreviewURL['id']) => {
	overlayState.currentImage = getAllMedia.value?.findIndex(img => img.id == imgId);
	overlayState.show = true;
}
const overlayClosed = () => { };

const copySelectedText = async () => {
	try {
		await navigator.clipboard.writeText((getSelection()?.toString() || '').trim());
		showMessage('Copied to clipboard', 'deep-purple-accent-3', 2000);
	} catch (e) {
		showMessage('Failed to copy', 'red-darken-4', 2000);
		console.error(e);
	}
};
const copyTextMessage = async () => {
	try {
		const msgText = messages.value.find(m => m.type === 'text' && m.id === msgCtxMenu.activeMessage)?.content.text.trim() || '';
		await navigator.clipboard.writeText(msgText);
		showMessage('Copied to clipboard', 'deep-purple-accent-3', 2000);
	} catch (e) {
		showMessage('Failed to copy', 'red-darken-4', 2000);
		console.error(e);
	}
};
const copyImage = async () => {
	try {
		const imageToCopy = messages.value.find(m => m.id === msgCtxMenu.activeMessage)?.content.attachments[0].raw.previewURL || '';
		await copyImageToClipboard(imageToCopy);
		showMessage('Copied to clipboard', 'deep-purple-accent-3', 2000);
	} catch (e) {
		showMessage('Failed to copy', 'red-darken-4', 2000);
		console.error(e);
	}
};
const downloadFile = async () => {
	try {
		const fileToDownLoad = messages.value.find(m => m.id === msgCtxMenu.activeMessage)?.content.attachments[0];
		if (fileToDownLoad) { 
			await downloadFileProcess(fileToDownLoad);
		}
	} catch (e) {
		showMessage('Failed to download', 'red-darken-4', 2000);
		console.error(e);
	}
};
const msgForm = ref<InstanceType<typeof MessageForm>>();
const editMessage = () => {
	const messageToEdit = messages.value.find(m => m.id === msgCtxMenu.activeMessage);
	if (messageToEdit) {
		msgForm.value?.editMessage(messageToEdit);
	}
};
const highlightMessage = (mId: Message['id']) => {
	if (isScrolling.value) {
		const stopWatcher = watch(isScrolling, (newVal) => {
			console.log(newVal);
			if (!newVal) {
				msgCtxMenu.activeMessage = mId;
				setTimeout(() => {
					stopWatcher();
					msgCtxMenu.activeMessage = '';
				}, 250);
			}
		});
	}
	else {
		msgCtxMenu.activeMessage = mId;
		setTimeout(() => {
			msgCtxMenu.activeMessage = '';
		}, 250);
	}
}
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
	overflow-y: auto;
	overflow-x: hidden;
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
	max-width: 1280px;
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

.message-item {}
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