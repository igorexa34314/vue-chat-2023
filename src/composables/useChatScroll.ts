import { ref, watchEffect, toRefs, computed, Ref, ComputedRef } from 'vue';
import { useScroll, useInfiniteScroll, watchPausable } from '@vueuse/core';
import { useMessagesStore } from '@/stores/messages';
import type { LastVisibleFbRef } from '@/stores/messages';
import type { Color } from 'csstype';

export const useChatScroll = (chatId: string, chatEl: Ref<HTMLElement | undefined>, messages: Ref<any> | ComputedRef<any>) => {
	const messagesStore = useMessagesStore();
	// Last visible doc refs on top and bottom (needs for infinite loading)
	const lastVisible = computed<LastVisibleFbRef>(() => messagesStore.lastVisible);

	const { arrivedState, isScrolling } = useScroll(chatEl, {
		offset: { bottom: 50 }
	});
	const scrollOpacity = ref<Color>('transparent');
	const { bottom } = toRefs(arrivedState);

	// Hiding scroll when inactive
	watchEffect(onCleanup => {
		if (isScrolling.value) {
			scrollOpacity.value = 'rgba(255, 255, 255, 0.2)';
		} else {
			const timer = setTimeout(() => (scrollOpacity.value = 'transparent'), 2000);
			onCleanup(() => clearTimeout(timer));
		}
	});

	// Scroll bottom with smooth or auto mode
	const scrollBottom = (behavior: ScrollBehavior = 'auto') => {
		if (chatEl.value && chatEl.value?.scrollHeight > chatEl.value?.clientHeight) {
			chatEl.value.scrollTo({
				top: chatEl.value.scrollHeight,
				behavior
			});
		}
	};

	// Watchers to scroll bottom when new message add
	const { pause: pauseMessageWatcher, resume: resumeMessageWatcher } = watchPausable(
		messages,
		() => {
			scrollBottom();
		},
		{ deep: true, flush: 'post' }
	);

	// Inf. scroll on top
	useInfiniteScroll(
		chatEl,
		async () => {
			if (lastVisible.value.top) {
				pauseMessageWatcher();
				await messagesStore.loadMoreChatMessages(chatId, 'top');
				resumeMessageWatcher();
			}
		},
		{ distance: 10, direction: 'top', preserveScrollPosition: true }
	);

	// Inf. scroll on bottom
	useInfiniteScroll(
		chatEl,
		async () => {
			if (lastVisible.value.bottom) {
				pauseMessageWatcher();
				await messagesStore.loadMoreChatMessages(chatId, 'bottom');
				resumeMessageWatcher();
			}
		},
		{ distance: 10, direction: 'bottom', preserveScrollPosition: false }
	);

	return {
		scrollOpacity,
		isScrollOnBottom: bottom,
		scrollBottom
	};
};
