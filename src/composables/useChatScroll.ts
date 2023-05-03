import { ref, watchEffect, toRefs, computed } from 'vue';
import { useScroll, useInfiniteScroll, watchPausable } from '@vueuse/core';
import { useMessagesStore } from '@/stores/messages';
import type { Ref } from 'vue';
import type { Color } from 'csstype';

export const useChatScroll = (chatEl: Ref<HTMLElement | undefined>, { onLoadMore }: { onLoadMore?: (direction: 'top' | 'bottom') => void }) => {
	const messagesStore = useMessagesStore();

	// Last visible doc refs on top and bottom (needs for infinite loading)
	const lastVisible = computed(() => messagesStore.lastVisible);
	// Messages store state
	const messages = computed(() => messagesStore.messages);

	// Hiding scroll when inactive
	const { arrivedState, isScrolling } = useScroll(chatEl, { offset: { bottom: 50 } });
	const { bottom } = toRefs(arrivedState);
	const scrollOpacity = ref<Color>('transparent');

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
		() => messages.value.length,
		(newVal, oldVal) => {
			if (newVal > oldVal) {
				scrollBottom();
			}
		},
		{ deep: true, flush: 'post' }
	);

	// Inf. scroll on top and bottom
	const applyInfScroll = (direction: 'both' | 'top' | 'bottom') => {
		const sides = direction === 'both' ? Object.keys(lastVisible.value) : direction;
		for (const dir of sides) {
			useInfiniteScroll(
				chatEl,
				async () => {
					if (lastVisible.value[dir as keyof typeof lastVisible.value]) {
						pauseMessageWatcher();
						await onLoadMore?.(dir as keyof typeof lastVisible.value);
						resumeMessageWatcher();
					}
				},
				{ distance: 10, direction: dir as keyof typeof lastVisible.value, preserveScrollPosition: dir === 'top' }
			);
		}
	};
	applyInfScroll('both');

	return {
		isScrolling,
		scrollOpacity,
		isScrollOnBottom: bottom,
		scrollBottom
	};
};
