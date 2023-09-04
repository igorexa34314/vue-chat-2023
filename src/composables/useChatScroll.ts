import { computed, Ref, toRefs, nextTick, watchEffect } from 'vue';
import { useScroll, watchPausable } from '@vueuse/core';
import { useMessagesStore, Direction } from '@/stores/messages';
import { VInfiniteScroll } from 'vuetify/labs/VInfiniteScroll';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/all';

gsap.registerPlugin(ScrollToPlugin);

export const useChatScroll = (
	scrollEl: Ref<HTMLElement | undefined>,
	onLoadMore: (direction: Direction) => void | Promise<void>
) => {
	const messagesStore = useMessagesStore();
	// Last visible doc refs on top and bottom (needs for infinite loading)
	const lastVisible = computed(() => messagesStore.lastVisible);

	// Messages store state
	const messages = computed(() => messagesStore.messages);

	// Hiding scroll when inactive
	const { arrivedState, isScrolling } = useScroll(scrollEl, {
		offset: { bottom: 600 },
		behavior: 'smooth',
	});
	const { bottom } = toRefs(arrivedState);

	const scrollSide = computed(() =>
		lastVisible.value.top && lastVisible.value.bottom
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
		() => messages.value.length,
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
		if (lastVisible.value[direction]) {
			pauseMessageWatcher();
			await onLoadMore?.(direction);
			resumeMessageWatcher();
			done('ok');
		} else done('empty');
	};

	return {
		isScrollOnBottom: bottom,
		onLoad,
		scrollSide,
		scrollBottom,
	};
};
