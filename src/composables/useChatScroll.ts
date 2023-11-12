import { computed, toRefs, nextTick, watch, type Ref } from 'vue';
import { useScroll, watchPausable } from '@vueuse/core';
import { useMessagesStore, type Direction } from '@/stores/messages';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/all';
import type { VInfiniteScroll } from 'vuetify/components';

gsap.registerPlugin(ScrollToPlugin);

export const useChatScroll = (
	scrollEl: Ref<HTMLElement | null>,
	onLoadMore: (direction: Direction) => void | Promise<void>
) => {
	// Messages store
	const messagesStore = useMessagesStore();

	// Last visible doc refs on top and bottom (needs for infinite loading)
	const lastVisible = computed(() => messagesStore.lastVisible);

	// Hiding scroll when inactive
	const { arrivedState, isScrolling } = useScroll(scrollEl, {
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

	// watchEffect(onCleanup => {
	// 	onCleanup(() => gsap.set('.chat__content', { '--v-scroll-bg': 'transparent' }));
	// 	if (isScrolling.value) {
	// 		gsap.set('.chat__content', { '--v-scroll-bg': 'rgba(255, 255, 255, 0.2)' });
	// 	}
	// });

	// Scroll bottom with smooth or auto mode
	const scrollBottom = (behavior: ScrollBehavior = 'auto') => {
		if (scrollEl.value && scrollEl.value?.scrollHeight > scrollEl.value?.clientHeight) {
			if (behavior !== 'smooth') {
				scrollEl.value?.scrollTo({
					top: scrollEl.value?.scrollHeight,
					behavior,
				});
			} else {
				gsap.to(scrollEl.value, {
					scrollTo: { y: 'max' },
					duration: 1,
					ease: 'power2.out',
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
