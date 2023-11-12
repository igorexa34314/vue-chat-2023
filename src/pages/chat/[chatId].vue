<template>
	<v-container class="h-100 pa-0 d-flex flex-column" fluid>
		<!-- Chat not exists message -->
		<div
			v-if="userChats.length && !userChats.some(el => el.info.id === chatId)"
			class="text-h5 pa-4 w-100 h-100 d-flex justify-center align-center">
			<v-card min-height="200px" class="d-flex" variant="tonal" elevation="20px" style="opacity: 0.5">
				<template #title>
					<h3>This chat does not exists</h3>
				</template>
			</v-card>
		</div>

		<!-- Chat content -->
		<div
			v-else-if="userChats && userChats.length"
			class="chat__field flex-fill overflow-hidden d-flex flex-column flex-grow-1">
			<div class="chat__content w-100 flex-fill">
				<div v-if="isChatLoading || messagesStore.isLoadingFirst"><page-loader /></div>
				<Suspense v-else-if="messages.length" @resolve="handleSuspenceResolve">
					<v-infinite-scroll
						:side="scrollSide ?? 'start'"
						@load="onLoad"
						margin="70px"
						ref="vuetifyScrollEl"
						tag="div"
						class="scrollable overflow-y-auto overflow-x-hidden flex-fill w-100 h-auto d-flex px-1 px-sm-4">
						<div class="messages-field flex-fill w-100 d-flex flex-column justify-end px-1 px-sm-3 my-0 mx-auto">
							<TransitionGroup :css="false" @before-enter="onBeforeEnter" @enter="onEnter" @leave="onLeave">
								<MessageItem
									v-for="m in messages"
									:key="m.id"
									:self="userInfo?.uid === m.sender.uid"
									:content="m.content"
									:sender="m.sender"
									:created_at="m.created_at"
									:updated_at="m.updated_at"
									@contextmenu="(e: MouseEvent) => openCtxMenu(e, m)"
									:id="`message-${m.id}`"
									:data-message-id="m.id"
									class="message-item px-2 px-sm-4 py-2"
									@open-in-overlay="openInOverlay"
									@dragstart.prevent
									@drop.prevent
									draggable="false" />
							</TransitionGroup>

							<ContextMenu
								v-model="msgCtxMenu.show"
								:content-type="msgCtxMenu.activeMessage?.content.type || 'text'"
								:self="userInfo?.uid === msgCtxMenu.activeMessage?.sender.uid"
								:max-width="350"
								:min-width="xs ? 0 : 200"
								:position="msgCtxMenu.position"
								@closed="ctxMenuClosed"
								@copy-selected="copySelectedText"
								@copy-image="copyImage"
								@copy-all="copyTextMessage"
								@download="downloadFile"
								@edit="editMessage"
								@delete="showConfirmation = true" />

							<ConfirmationDialog
								title="Are you sure you want to delete this message?"
								v-model="showConfirmation"
								@on-submit="deleteMessage" />

							<FullsizeOverlay
								v-model="overlayState.show"
								:content="getAllMedia"
								v-model:currentItem="overlayState.currentImage"
								@close="overlayClosed" />
						</div>

						<template #empty></template>
						<template #loading></template>
						<template #error></template>
					</v-infinite-scroll>
				</Suspense>

				<!-- Chat empty message -->
				<div v-else class="text-h5 pa-4 w-100 h-100 d-flex justify-center align-center">
					<v-card min-height="200px" class="d-flex" variant="tonal" elevation="20px" style="opacity: 0.5">
						<template #title>
							<h3>This chat is empty right now</h3>
						</template>
					</v-card>
				</div>
			</div>

			<!-- Message form -->
			<MessageForm
				class="message-form flex-0-0 d-flex mx-auto w-100 pb-sm-4 pt-1 pt-sm-2 px-sm-6"
				ref="msgForm"
				@create-message="createMessage"
				@update-message="updateMessage"
				@scroll-to-message="scrollToAndHighlightMessage"
				:class="xs ? 'px-2 pb-2' : 'px-3 pb-3'" />

			<!-- Go on bottom of the page button -->
			<v-fade-transition>
				<v-btn
					v-if="srollEl && srollEl.scrollHeight > srollEl.clientHeight && !isScrollOnBottom"
					class="fixed-button-scrolldown"
					color="blue-grey-darken-1"
					:icon="mdiArrowDown"
					size="default"
					@click="scrollBottom('smooth')" />
			</v-fade-transition>
		</div>

		<!-- <v-dialog v-model="attachDialog" width="auto" ref="dropZone">
			<v-card minHeight="80vh" minWidth="80vh" class="bg-blue-accent-1 d-flex flex-column align-center justify-center"
				style="position: relative; left: 25%">
				<div class="attach-frame flex-grow-1 d-flex align-center justify-center text-h4 ma-6 font-weight-bold">
					Прикрепите файлы
				</div>
			</v-card>
		</v-dialog> -->
	</v-container>
</template>

<script setup lang="ts">
import MessageItem from '@/components/chat/messages/MessageItem.vue';
import { mdiArrowDown } from '@mdi/js';
import sbMessages from '@/utils/messages.json';
import MessageForm, { type EditMessageData } from '@/components/chat/form/MessageForm.vue';
import {
	MessagesService,
	type CreateMsgForm,
	type Message,
	type MediaAttachment,
	type MessageContent,
	type MessageAttachment,
} from '@/services/message';
import { useSnackbarStore } from '@/stores/snackbar';
import { useUserStore } from '@/stores/user';
import { useMessagesStore } from '@/stores/messages';
import { ChatService, type ChatInfo } from '@/services/chat';
import { ref, computed, onUnmounted, nextTick, watch, toRef, defineAsyncComponent } from 'vue';
import { useMeta } from 'vue-meta';
import { useRoute } from 'vue-router/auto';
import { useChatScroll } from '@/composables/useChatScroll';
import { useAsyncState, useDropZone } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { setChatName } from '@/utils/chat';
import { downloadFile as downloadFileProcess } from '@/utils/message/fileActions';
import { copyToClipboard as copyImageToClipboard } from '@/utils/message/imageActions';
import { gsap, ScrollToPlugin } from 'gsap/all';
import { useDisplay } from 'vuetify';
import type { VInfiniteScroll } from 'vuetify/components';
import type { Unsubscribe } from 'firebase/firestore';
import type { ContentType } from '@/types/db/MessagesTable';

const FullsizeOverlay = defineAsyncComponent(() => import('@/components/chat/messages/media/FullsizeOverlay.vue'));
const ContextMenu = defineAsyncComponent(() => import('@/components/chat/ContextMenu.vue'));
const ConfirmationDialog = defineAsyncComponent(() => import('@/components/UI/ConfirmationDialog.vue'));

const emit = defineEmits<{
	updateTitle: [title: string];
}>();

gsap.registerPlugin(ScrollToPlugin);

const { xs } = useDisplay();
const { chats: userChats, info: userInfo } = storeToRefs(useUserStore());
const route = useRoute('/chat/[chatId]');
const { showMessage } = useSnackbarStore();
const messagesStore = useMessagesStore();
const { $reset: resetMsgStore } = messagesStore;
const title = ref('');

const chatId = toRef(() => route.params.chatId);

const {
	state: chatState,
	isLoading: isChatLoading,
	execute: fetchChat,
} = useAsyncState(
	async (id?: ChatInfo['id']) => {
		const chatInfo = await ChatService.getChatInfoById(id ?? chatId.value);
		if (chatInfo) {
			title.value = setChatName.value(chatInfo);
			emit('updateTitle', title.value);
		}
		const unsub = MessagesService.subscribeMessages(id ?? chatId.value) as Unsubscribe | null;
		await MessagesService.fetchMessages(id ?? chatId.value);
		return { chatInfo, unsub };
	},
	{ chatInfo: null, unsub: null },
	{
		onError: e => {
			console.error(e);
			showMessage('Error loading chat', 'red-darken-3');
		},
	}
);

useMeta(computed(() => ({ title: title.value })));

const { messages } = storeToRefs(messagesStore);

// Reset messages when switching chat
watch(chatId, async (newId, oldId, onCleanup) => {
	chatState.value.unsub?.();
	resetMsgStore();
	if (newId) {
		await fetchChat(0, newId);
	}
	// Unsubscribe from receiving messages realtime firebase
	onCleanup(() => {
		chatState.value.unsub?.();
		resetMsgStore();
	});
});

// Unsubscribe from receiving messages realtime firebase
onUnmounted(() => {
	chatState.value.unsub?.();
	resetMsgStore();
});

const vuetifyScrollEl = ref<VInfiniteScroll | null>(null);
const srollEl = toRef(() => vuetifyScrollEl.value?.$el as HTMLElement | null);

const { isScrollOnBottom, scrollBottom, onLoad, scrollSide } = useChatScroll(srollEl, async direction => {
	await MessagesService.loadMoreMessages(chatId.value, direction);
});

const handleSuspenceResolve = () => {
	scrollBottom();
};

const allowTransition = ref(false);
const createMessage = async <T extends ContentType>(content: CreateMsgForm<T>) => {
	try {
		allowTransition.value = true;
		await MessagesService.createMessage(chatId.value, content);
	} catch (e) {
		showMessage(sbMessages[e as keyof typeof sbMessages] || (e as string), 'red-darken-3', 2000);
	} finally {
		nextTick().then(() => (allowTransition.value = false));
	}
};
const updateMessage = async ({ id, content }: EditMessageData) => {
	try {
		await MessagesService.updateMessage(chatId.value, { id, content });
	} catch (e) {
		showMessage(sbMessages[e as keyof typeof sbMessages] || (e as string), 'red-darken-3', 2000);
	}
};

interface MessageContextMenu {
	show: boolean;
	position: { x: number; y: number };
	activeMessage: Message | null;
	closestAttachementId?: MessageAttachment['id'] | null;
}
// Context menu on message right click
const msgCtxMenu = ref<MessageContextMenu>({
	show: false,
	position: { x: 0, y: 0 },
	activeMessage: null as Message | null,
});
const openCtxMenu = (e: MouseEvent, message: Message) => {
	const highlighter = gsap.utils.selector(`#message-${message.id}`)('span.highlighter');
	gsap.set(highlighter, {
		autoAlpha: 0.2,
	});

	msgCtxMenu.value = {
		show: false,
		activeMessage: message,
		position: { x: e.clientX, y: e.clientY },
	};

	if (message.content.type !== 'text') {
		msgCtxMenu.value.closestAttachementId = (e.target as HTMLElement | null)
			?.closest(msgCtxMenu.value.activeMessage?.content.type === 'media' ? '.image__wrapper' : '.file__wrapper')
			?.getAttribute('data-attachment-id');
	}
	nextTick().then(() => (msgCtxMenu.value.show = true));
};

const ctxMenuClosed = () => {
	const highlighter = gsap.utils.selector(`#message-${msgCtxMenu.value.activeMessage?.id}`)('span.highlighter');
	gsap.set(highlighter, {
		autoAlpha: 0,
	});
};

const getAllMedia = computed<MediaAttachment[]>(() =>
	messages.value
		.filter(m => m.content.type !== 'text')
		.flatMap(m => (m.content as MessageContent<'media'>).attachments.filter(f => f.raw?.previewURL))
);
const overlayState = ref({
	show: false,
	currentImage: 0,
});
const openInOverlay = (imgId: MediaAttachment['id']) => {
	overlayState.value = { show: true, currentImage: getAllMedia.value?.findIndex(img => img.id == imgId) };
};
const overlayClosed = () => {};

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
		const msgText =
			messages.value
				.find(m => m.content.type === 'text' && m.id === msgCtxMenu.value.activeMessage?.id)
				?.content.text.trim() || '';
		await navigator.clipboard.writeText(msgText);
		showMessage('Copied to clipboard', 'deep-purple-accent-3', 2000);
	} catch (e) {
		showMessage('Failed to copy', 'red-darken-4', 2000);
		console.error(e);
	}
};
const copyImage = async () => {
	try {
		const msgContent = msgCtxMenu.value.activeMessage?.content as MessageContent<'media'> | null;
		const imageToCopy =
			msgContent?.attachments.find(attach => attach.id === msgCtxMenu.value.closestAttachementId)?.raw.previewURL ||
			msgContent?.attachments[0].raw.previewURL ||
			'';
		await copyImageToClipboard(imageToCopy);
		showMessage('Copied to clipboard', 'deep-purple-accent-3', 2000);
	} catch (e) {
		showMessage('Failed to copy', 'red-darken-4', 2000);
		console.error(e);
	}
};
const downloadFile = async () => {
	try {
		const msgContent = msgCtxMenu.value.activeMessage?.content as MessageContent<'file'> | null;
		const filesToDownLoad = msgContent?.attachments;
		filesToDownLoad?.map(downloadFileProcess);
	} catch (e) {
		showMessage('Failed to download', 'red-darken-4', 2000);
		console.error(e);
	}
};
const msgForm = ref<InstanceType<typeof MessageForm> | null>(null);
const editMessage = () => {
	if (msgCtxMenu.value.activeMessage?.id) {
		msgForm.value?.editMessage(msgCtxMenu.value.activeMessage);
	}
};

const showConfirmation = ref(false);
const deleteMessage = async () => {
	if (msgCtxMenu.value.activeMessage?.id) {
		await MessagesService.deleteMessageById(chatId.value, msgCtxMenu.value.activeMessage?.id);
	}
};
const scrollToAndHighlightMessage = (mId: Message['id']) => {
	const highlighter = gsap.utils.selector(`#message-${mId}`)('span.highlighter');
	gsap
		.timeline({ delay: 0 })
		.to(srollEl.value, {
			scrollTo: { y: `#message-${mId}`, autoKill: true, offsetY: 100 },
			duration: 0.4,
			ease: 'power2',
		})
		.fromTo(
			highlighter,
			{
				autoAlpha: 0.2,
			},
			{
				autoAlpha: 0,
				ease: 'power0',
				duration: 2.5,
			},
			'<'
		);
};

const onBeforeEnter = (el: Element) => {
	if (allowTransition.value) {
		// 	gsap.set(el, { autoAlpha: 0 })
	}
};

const onEnter = (el: Element, done: () => void) => {
	if (allowTransition.value) {
		gsap.from(el, {
			autoAlpha: 0,
			translateX: '-0.01%',
			translateY: '100%',
			scale: 0.5,
			duration: 0.2,
			onComplete: done,
		});
	} else done();
};

const onLeave = (el: Element, done: () => void) => {
	if (allowTransition.value) {
		gsap.to(el, {
			opacity: 0,
			height: 0,
			onComplete: done,
		});
	} else done();
};

// TODO
// const attachDialog = ref(false);
// Using chat scroll composable with infinite scroll
const { isOverDropZone } = useDropZone(
	toRef(() => srollEl.value),
	files => {
		if (files) {
			msgForm.value?.attachFiles('file', files);
		}
	}
);

// const addAttachment = () => {
// 	console.log('Drag enter');
// 	attachDialog.value = true;
// };
// const removeAttachment = () => {
// 	console.log('Drag leave');
// 	attachDialog.value = false;
// };
</script>

<style lang="scss" scoped>
// Custom scroll
.chat__content {
	--v-scroll-bg: transparent;
	&:hover {
		--v-scroll-bg: rgba(255, 255, 255, 0.2);
	}
}
@import '@/assets/styles/scroll';

.container {
}
.chat__field {
}
.chat__content {
	position: relative;
	z-index: 1;
}
.scrollable {
	position: absolute;
	max-height: 100%;
	inset: 0;
}
:global(.message-form) {
	max-width: 1080px;
	transition: height 0.2s ease-in 0s;
}
.messages-field {
	max-width: 1080px;
	& > :last-child {
		padding-bottom: 0 !important;
	}
	& > :first-child {
		padding-top: 0 !important;
	}
}
.message-item {
}
.attach-frame {
	width: 90%;
	border: 3px dashed #1a237e;
}
.fixed-button-scrolldown {
	position: absolute;
	bottom: 2rem;
	right: 0;
	z-index: 100;
	transform: translate(-50%, -100%);
	@media (max-width: 600px) {
		bottom: 1.5rem;
	}
	@media (max-width: 600px) {
		bottom: 1.2rem;
	}
}
</style>
