import { defineStore } from 'pinia';

export const useMessagesStore = defineStore('messages', {
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
});
