import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { defaultAvatar, savedMessages } from '@/global-vars';
import { ChatInfo } from '@/services/chat';
import { setUserDisplayName } from '@/utils/user';

export const setChatName = computed(() => (chat: ChatInfo) => {
	const userStore = useUserStore();
	return chat.type === 'saved'
		? 'Saved messages'
		: chat.type === 'private'
		? setUserDisplayName.value(chat.members.find(m => m.uid !== userStore.info?.uid)!)
		: chat.name;
});
export const setChatAvatar = computed(() => (chat: ChatInfo) => {
	const userdataStore = useUserStore();
	return chat.type === 'private'
		? chat.members.find(m => m.uid !== userdataStore.info?.uid)?.photoURL || defaultAvatar
		: chat.type === 'saved'
		? savedMessages
		: defaultAvatar;
});
