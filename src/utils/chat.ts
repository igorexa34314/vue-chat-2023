import { computed } from 'vue';
import { useUserdataStore } from '@/stores/userdata';
import { defaultAvatar, savedMessages } from '@/utils/globals';
import type { ChatInfo } from '@/services/chat';

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
