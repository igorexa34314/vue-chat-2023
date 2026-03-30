import { computed, toRefs, nextTick, watch, type MaybeRefOrGetter, toValue } from 'vue';
import { useScroll, watchPausable } from '@vueuse/core';
import { useMessagesStore, type Direction } from '@/stores/messages';
import type { VInfiniteScroll } from 'vuetify/components';
import { useGoTo } from 'vuetify';

export const useChatScroll = (
	scrollRef: MaybeRefOrGetter<HTMLElement | null>,
	onLoadMore: (direction: Direction) => void | Promise<void>
) => {
	const goTo = useGoTo();

	// Messages store
	const messagesStore = useMessagesStore();

	// Last visible doc refs on top and bottom (needs for infinite loading)
	const lastVisible = computed(() => messagesStore.lastVisible);

	// Hiding scroll when inactive
	const { arrivedState, isScrolling } = useScroll(scrollRef, {
		offset: { bottom: 300 },
	});
	const { bottom } = toRefs(arrivedState);

	const scrollSide = computed(() =>
		messagesStore.isLoading
			? undefined
			: lastVisible.value.top && lastVisible.value.bottom
				? 'both'
				: lastVisible.value.top
					? 'start'
					: lastVisible.value.bottom
						? 'end'
						: undefined
	);

	// Scroll bottom with smooth or auto mode
	const scrollBottom = (behavior: ScrollBehavior = 'auto') => {
		const scrollEl = toValue(scrollRef);
		if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight) {
			if (behavior !== 'smooth') {
				scrollEl.scrollTop = scrollEl.scrollHeight;
			} else {
				goTo(scrollEl.scrollHeight, {
					container: scrollEl,
					duration: 1,
					easing: 'easeInOutCubic',
				});
			}
		}
	};

	// Watchers to scroll bottom when new message add
	const { pause: pauseMessageWatcher, resume: resumeMessageWatcher } = watchPausable(
		() => messagesStore.messages.length,
		(newVal, oldVal) => {
			if (newVal > oldVal && !isScrolling.value) {
				nextTick().then(() => scrollBottom('instant'));
			}
		},
		{ deep: true }
	);

	// Inf. scroll on top and bottom
	const onLoad: VInfiniteScroll['onLoad'] = async ({ side, done }) => {
		const direction: Direction = side === 'start' ? 'top' : 'bottom';
		if (messagesStore.isLoading) {
			done('loading');
		} else if (lastVisible.value[direction]) {
			await onLoadMore?.(direction);
			done('ok');
		} else done('empty');
	};

	watch(
		() => messagesStore.isLoading,
		newVal => {
			if (newVal) {
				pauseMessageWatcher();
			} else {
				nextTick().then(() => resumeMessageWatcher());
			}
		},
		{ immediate: true }
	);

	return {
		isScrollOnBottom: bottom,
		onLoad,
		scrollSide,
		scrollBottom,
	};
};
