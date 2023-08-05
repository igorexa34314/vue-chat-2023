<template>
	<v-container class="container d-flex flex-column" fluid>
		<div v-if="userChats && userChats.length && !userChats.some(el => el === chatId)" class="text-h5 pa-5">
			This chat doesnt exists</div>
		<div v-else-if="userChats && userChats.length" class="chat__field d-flex flex-column flex-grow">
			<div class="chat__content">
				<div v-if="loading"><page-loader /></div>

				<v-infinite-scroll v-else-if="messages && messages.length" :side="scrollSide || 'start'" @load="onLoad"
					:margin="50" ref="srollEl" tag="div" class="scrollable d-flex px-2 px-sm-4">
					<div class="messages-field d-flex flex-column justify-end px-1 px-sm-3">
						<TransitionGroup :css="false" @before-enter="onBeforeEnter" @enter="onEnter" @leave="onLeave">
							<MessageItem v-for="m in messages" :key="m.id" :self="uid === m.sender.id" :type="m.type"
								:content="m.content" :sender="m.sender" :created_at="<Date>m.created_at"
								@contextmenu="(e: MouseEvent) => openCtxMenu(e, { mId: m.id, mType: m.type })"
								:id="`message-${m.id}`" :data-message-id="m.id" class="message-item px-2 px-sm-4 py-2"
								@open-in-overlay="openInOverlay" @dragstart.prevent @drop.prevent draggable="false" />
						</TransitionGroup>

						<ContextMenu v-model="msgCtxMenu.show" :content-type="msgCtxMenu.contentType"
							:position="msgCtxMenu.position" @closed="ctxMenuClosed" @copy-selected="copySelectedText"
							@copy-image="copyImage" @copy-all="copyTextMessage" @download="downloadFile" @edit="editMessage" />

						<FullsizeOverlay v-model="overlayState.show" :content="<ImageWithPreviewURL[]>getAllMedia"
							v-model:currentItem="overlayState.currentImage" @close="overlayClosed" />
					</div>

					<template #empty></template>
					<template #loading></template>
					<template #error></template>
				</v-infinite-scroll>

				<!-- <div v-else class="text-h5 pa-4">This chat is empty right now
				</div> -->
			</div>
			<MessageForm class="message-form pb-sm-4 pt-1 pt-sm-2 px-sm-6" ref="msgForm" @create-message="createMessage"
				@update-message="updateMessage" @scroll-to-message="scrollToAndHighlightMessage"
				:class="xs ? 'px-2 pb-2' : 'px-3 pb-3'" />

			<v-fade-transition>
				<v-btn v-if="srollEl && srollEl?.$el.scrollHeight > srollEl?.$el.clientHeight && !isScrollOnBottom"
					class="fixed-button-scrolldown" color="blue-grey-darken-1" :icon="mdiArrowDown" size="default"
					@click="scrollBottom('smooth')" />
			</v-fade-transition>

		</div>
		<!-- <v-dialog v-model="attachDialog" width="auto" ref="dropZone">
			<v-card minHeight="80vh" minWidth="80vh" class="bg-blue-accent-1 d-flex flex-column align-center justify-center"
				style="position: relative; left: 25%">
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
import { ref, computed, onUnmounted, nextTick, watchEffect, toRef } from 'vue';
import { useMeta } from 'vue-meta';
import { useRoute } from 'vue-router';
import { useChatScroll } from '@/composables/useChatScroll';
import { loadMoreChatMessages } from '@/services/message';
import { useDropZone } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { setChatName } from '@/utils/chat';
import { downloadFile as downloadFileProcess } from '@/utils/message/fileActions';
import { copyToClipboard as copyImageToClipboard } from '@/utils/message/imageActions';
import { Unsubscribe } from 'firebase/firestore';
import { VDialog } from 'vuetify/components';
import { ImageWithPreviewURL } from '@/components/chat/messages/media/ImageFrame.vue';
import { VInfiniteScroll } from 'vuetify/labs/VInfiniteScroll';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/all';
import { useDisplay } from 'vuetify';

gsap.registerPlugin(ScrollToPlugin);

const { getUChats: userChats } = storeToRefs(useUserdataStore());
const route = useRoute();
const { showMessage } = useSnackbarStore();
const messagesStore = useMessagesStore();
const { xs } = useDisplay();
const { $reset: resetMsgStore } = messagesStore;

const chatInfo = ref<ChatInfo>();
const srollEl = ref<VInfiniteScroll>();
const loading = ref(false);
const messages = computed(() => messagesStore.messages);
let unsub: Unsubscribe | undefined;
const chatId = toRef(() => route.params.chatId as string);
const uid = useCurrentUser().value?.uid;

const attachDialog = ref(false);
const dropZone = ref<VDialog | HTMLElement>();

// Using chat scroll composable with infinite scroll
const { isScrollOnBottom, scrollBottom, onLoad, scrollSide } = useChatScroll(toRef(() => srollEl.value?.$el), async (direction) => {
	await loadMoreChatMessages(chatId.value, direction);
});

// const { isOverDropZone } = useDropZone(dropZone.value as HTMLElement, (files) => {
// 	console.log('droppped', files)
// });

//Dynamic page title
useMeta(computed(() => {
	if (chatInfo.value && Object.keys(chatInfo.value).length)
		return { title: setChatName.value(chatInfo.value) };
	return { title: 'Chat' };
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
	unsub?.();
	resetMsgStore();
	if (chatId.value) {
		try {
			loading.value = true;
			chatInfo.value = await getChatInfoById(chatId.value);
			unsub = await fetchChatMessages(chatId.value);
		} catch (e) {
			console.error(e);
		}
		finally {
			await nextTick();
			loading.value = false;
		}
	}
	// Unsubscribe from receiving messages realtime firebase
	onCleanup(() => {
		unsub?.();
		resetMsgStore();
	});
});

const allowTransition = ref(false);
const createMessage = async (type: Message['type'] = 'text', content: Partial<AttachFormContent>) => {
	try {
		allowTransition.value = true;
		await createDBMessage(chatId.value, type, content);
	} catch (e) {
		showMessage(sbMessages[e as keyof typeof sbMessages] || e as string, 'red-darken-3', 2000);
	}
	finally {
		nextTick().then(() => allowTransition.value = false);
	}
};
const updateMessage = async ({ id, type, content }: EditMessageData) => {
	try {
		await updateDBMessageContent(chatId.value, { id, type, content });
	} catch (e) {
		showMessage(sbMessages[e as keyof typeof sbMessages] || e as string, 'red-darken-3', 2000);
	}
};

// Context menu on message right click
const msgCtxMenu = ref({
	show: false,
	contentType: 'text' as Message['type'],
	position: { x: 0, y: 0 },
	activeMessage: '' as Message['id']
});
const openCtxMenu = (e: MouseEvent, { mId, mType }: { mId: Message['id']; mType?: Message['type'] }) => {
	const highlighter = gsap.utils.selector(`#message-${mId}`)('span.highlighter');
	gsap.set(highlighter, {
		autoAlpha: 0.2,
	});
	msgCtxMenu.value = { show: false, activeMessage: mId, position: { x: e.clientX, y: e.clientY }, contentType: mType || 'text' };
	nextTick().then(() => msgCtxMenu.value.show = true);
};

const ctxMenuClosed = () => {
	const highlighter = gsap.utils.selector(`#message-${msgCtxMenu.value.activeMessage}`)('span.highlighter');
	gsap.set(highlighter, {
		autoAlpha: 0,
	});
};
// Unsubscribe from receiving messages realtime firebase
onUnmounted(() => {
	unsub?.();
	resetMsgStore();
});
const getAllMedia = computed(() => messages.value.filter(m => m.type !== 'text').flatMap(m => m.content.attachments.filter(f => f.raw?.previewURL)));
const overlayState = ref({
	show: false,
	currentImage: 0,
});
const openInOverlay = (imgId: ImageWithPreviewURL['id']) => {
	overlayState.value = { show: true, currentImage: getAllMedia.value?.findIndex(img => img.id == imgId) };
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
		const msgText = messages.value.find(m => m.type === 'text' && m.id === msgCtxMenu.value.activeMessage)?.content.text.trim() || '';
		await navigator.clipboard.writeText(msgText);
		showMessage('Copied to clipboard', 'deep-purple-accent-3', 2000);
	} catch (e) {
		showMessage('Failed to copy', 'red-darken-4', 2000);
		console.error(e);
	}
};
const copyImage = async () => {
	try {
		const imageToCopy = messages.value.find(m => m.id === msgCtxMenu.value.activeMessage)?.content.attachments[0].raw.previewURL || '';
		await copyImageToClipboard(imageToCopy);
		showMessage('Copied to clipboard', 'deep-purple-accent-3', 2000);
	} catch (e) {
		showMessage('Failed to copy', 'red-darken-4', 2000);
		console.error(e);
	}
};
const downloadFile = async () => {
	try {
		const fileToDownLoad = messages.value.find(m => m.id === msgCtxMenu.value.activeMessage)?.content.attachments[0];
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
	const messageToEdit = messages.value.find(m => m.id === msgCtxMenu.value.activeMessage);
	if (messageToEdit) {
		msgForm.value?.editMessage(messageToEdit);
	}
};
const scrollToAndHighlightMessage = (mId: Message['id']) => {
	const highlighter = gsap.utils.selector(`#message-${mId}`)('span.highlighter');
	gsap.timeline({ delay: 0 })
		.to(srollEl.value?.$el, {
			scrollTo: { y: `#message-${mId}`, autoKill: true, offsetY: 100 }, duration: 0.4, ease: 'power2',
		})
		.fromTo(highlighter, {
			autoAlpha: 0.2
		}, {
			autoAlpha: 0,
			ease: 'power0',
			duration: 2.5,
		}, '<');
}

const onBeforeEnter = (el: Element) => {
	if (allowTransition.value) {
		// 	gsap.set(el, { autoAlpha: 0 })
	}
}

const onEnter = (el: Element, done: () => void) => {
	if (allowTransition.value) {
		gsap.from(el, {
			autoAlpha: 0,
			translateX: '-0.01%',
			translateY: '100%',
			scale: 0.5,
			duration: 0.2,
			onComplete: done
		})
	} else done()
}

const onLeave = (el: Element, done: () => void) => {
	if (allowTransition.value) {
		gsap.to(el, {
			opacity: 0,
			height: 0,
			onComplete: done
		})
	}
	else done()
}
</script>

<style lang="scss" scoped>
// Custom scroll
.chat__content {
	--v-scroll-bg: transparent;
	&:hover {
		--v-scroll-bg: rgba(255, 255, 255, 0.2);
	}
}
@import "@/assets/styles/scroll";

.container {
	padding: 0 !important;
	height: 100%;
}
.chat__field {
	flex: 1 1 auto;
	overflow: hidden;
}
.chat__content {
	width: 100%;
	flex: 1 1 auto;
	position: relative;
	z-index: 1;
}
.scrollable {
	width: 100%;
	position: absolute;
	max-height: 100%;
	height: auto;
	flex: 1 1 auto;
	overflow-y: overlay;
	overflow-y: auto;
	overflow-x: hidden;
	inset: 0;
}
:global(.message-form) {
	width: 100%;
	flex: 0 0 auto;
	margin-left: auto;
	margin-right: auto;
	display: flex;
	max-width: 1080px;
	transition: height 0.2s ease-in 0s;
}
.messages-field {
	flex: 1 1 auto;
	width: 100%;
	margin: 0 auto;
	max-width: 1080px;
	& > :last-child {
		padding-bottom: 0 !important;
	}
	& > :first-child {
		padding-top: 0 !important;
	}
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
	transform: translate(-50%, -100%);
	bottom: 2rem;
	right: 0;
	z-index: 100;
}
</style>
@/plugins/chat