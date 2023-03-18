import { computed } from 'vue';
import { useUserdataStore } from '@/stores/userdata';
import type { ChatInfo } from '@/services/chat';

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;
const savedMessages = new URL('@/assets/img/saved-messages.png', import.meta.url).href;

export const setChatName = computed(() => (chat: ChatInfo) => {
	const userdataStore = useUserdataStore();
	return chat.type === 'self'
		? 'Saved messages'
		: chat.type === 'private'
		? (chat.members.find(m => m.uid !== userdataStore.userdata?.info.uid)?.displayName as string)
		: chat.name;
});
export const setChatAvatar = computed(() => (chat: ChatInfo) => {
	const userdataStore = useUserdataStore();
	return chat.type === 'private'
		? (chat.members.find(m => m.uid !== userdataStore.userdata?.info.uid)?.photoURL as string)
		: chat.type === 'self'
		? savedMessages
		: defaultAvatar;
});
