import { ref, watchEffect, toRef, computed, Ref, toRefs, nextTick } from 'vue';
import { useScroll, watchPausable } from '@vueuse/core';
import { useMessagesStore, Direction } from '@/stores/messages';
import { VInfiniteScroll } from 'vuetify/lib/labs/components.mjs';

export const useChatScroll = (
	vuetifyScroll: Ref<VInfiniteScroll | undefined>,
	onLoadMore: (direction: Direction) => void | Promise<void>
) => {
	const messagesStore = useMessagesStore();
	const scrollEl = toRef(() => vuetifyScroll.value?.$el as HTMLElement | undefined);
	// Last visible doc refs on top and bottom (needs for infinite loading)
	const lastVisible = computed(() => messagesStore.lastVisible);

	// Messages store state
	const messages = computed(() => messagesStore.messages);

	// Hiding scroll when inactive
	const { arrivedState, isScrolling } = useScroll(scrollEl, {
		offset: { bottom: 10, top: 10 },
		behavior: 'smooth'
	});
	const { bottom } = toRefs(arrivedState);
	const scrollOpacity = ref<string>('transparent');

	const scrollSide = computed(() =>
		lastVisible.value.top && lastVisible.value.bottom
			? 'both'
			: lastVisible.value.top
			? 'start'
			: lastVisible.value.bottom
			? 'end'
			: undefined
	);

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
		if (scrollEl.value && scrollEl.value.scrollHeight > scrollEl.value.clientHeight) {
			scrollEl.value.scrollTo({
				top: scrollEl.value.scrollHeight,
				behavior
			});
		}
	};

	// Watchers to scroll bottom when new message add
	const { pause: pauseMessageWatcher, resume: resumeMessageWatcher } = watchPausable(
		() => messages.value.length,
		async (newVal, oldVal) => {
			if (newVal > oldVal) {
				await nextTick();
				scrollBottom('instant');
			}
		},
		{ deep: true }
	);

	// Inf. scroll on top and bottom
	const onLoad: VInfiniteScroll['onLoad'] = async ({ side, done }) => {
		const direction: Direction = side === 'start' ? 'top' : 'bottom';
		if (lastVisible.value[direction]) {
			pauseMessageWatcher();
			scrollEl.value?.removeEventListener('mouseup', e => {});
			await onLoadMore?.(direction);
			scrollEl.value?.addEventListener('mouseup', e => {});
			resumeMessageWatcher();
			done('ok');
		} else done('empty');
	};

	return {
		isScrolling,
		scrollOpacity,
		isScrollOnBottom: bottom,
		onLoad,
		scrollSide,
		scrollBottom
	};
};
