<template>
	<v-container class="container pt-6">
		<div v-if="interloc">
			<h2 class="mb-5">Страница чата с {{ interloc.displayName }}</h2>
			<div class="chat__content mb-10">
				<!-- <div class="messages-field">
									<TransitionGroup name="messages-list">
										<MessageItem v-for="(m, index) in messages" :key="index" :textContent="m.textContent" :sender="m.user" />
									</TransitionGroup>
								</div> -->
				<MessageForm class="message-form" @submitForm="createMessage" />
			</div>
		</div>
	</v-container>
</template>

<script setup>
import MessageItem from '@/components/MessageItem.vue';
import MessageForm from '@/components/MessageForm.vue';
import { useChatStore } from '@/stores/chat';
import { useUserdataStore } from '@/stores/userdata';
import { useAuthStore } from '@/stores/auth';
import { uuidv4 } from '@firebase/util';
import { ref, computed, onMounted } from 'vue';
import { useMeta } from 'vue-meta';
import { useRoute } from 'vue-router';

const route = useRoute();
const auth = useAuthStore();
const chatStore = useChatStore();
const userdataStore = useUserdataStore();
const interloc = ref();

onMounted(async () => {
	interloc.value = await userdataStore.getUserdataById(route.params.id);
});

const messages = computed(() => chatStore.messages);

const user = computed(() => userdataStore.userdata);

useMeta({ title: `Комната ${user.room}` });

const createMessage = async messageText => {
	await chatStore.createMessage({
		to: route.params.id,
		content: {
			text: messageText,
		},
		date: new Date(),
	});
};
</script>

<style lang="scss" scoped>
.container {
	min-height: calc(100vh - 64px);
	display: flex;
	flex-direction: column;
}
.chat__content {
	flex: 1 1 auto;
	position: relative;
}
.message-form {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
}

.messages-list-enter-active,
.messages-list-leave-active {
	transition: all 0.5s ease;
}
.messages-list-enter-from,
.messages-list-leave-to {
	opacity: 0;
	transform: translateX(30px);
}
</style>

<route lang="yaml">
meta:
  requiresAuth: true 
</route>