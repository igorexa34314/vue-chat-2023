import { computed } from 'vue';
import { useUserdataStore } from '@/stores/userdata';
import { defaultAvatar, savedMessages } from '@/global-vars';
import { ChatInfo } from '@/services/chat';

export const setChatName = computed(() => (chat: ChatInfo) => {
	const userdataStore = useUserdataStore();
	return chat.type === 'saved'
		? 'Saved messages'
		: chat.type === 'private'
		? (chat.members.find(m => m.uid !== userdataStore.userdata?.info.uid)?.displayName as string)
		: chat.name;
});
export const setChatAvatar = computed(() => (chat: ChatInfo) => {
	const userdataStore = useUserdataStore();
	return chat.type === 'private'
		? (chat.members.find(m => m.uid !== userdataStore.userdata?.info.uid)?.photoURL as string)
		: chat.type === 'saved'
		? savedMessages
		: defaultAvatar;
});
