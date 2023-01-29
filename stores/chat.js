import { defineStore } from 'pinia';

// const app = useNuxtApp();

export const useChatStore = defineStore('chat', () => {
	// const message = computed(() => app.$ioState().value.messages);
	// const messages = ref([]);
	// watch(
	// 	message,
	// 	newVal => {
	// 		addMessage(newVal);
	// 		console.log('Chages', newVal);
	// 	},
	// 	{ deep: true }
	// );
	return {
		state: () => ({
			messages: []
		}),
		actions: {
			addMessage(message) {
				this.messages.push(message);
			},
			messageRecieved() {
				console.log('Message');
			}
		}
	};
});
