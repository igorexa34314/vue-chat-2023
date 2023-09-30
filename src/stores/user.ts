import { defineStore } from 'pinia';
import { ref } from 'vue';
import { PublicUserInfo, UserChat, UserFriend } from '@/services/user';

export const useUserStore = defineStore('user', () => {
	const info = ref<PublicUserInfo | null>(null);
	const chats = ref<UserChat[]>([]);

	const isChatsLoading = ref(false);

	const friends = ref<UserFriend[]>([]);

	const setInfo = (uinfo: Partial<PublicUserInfo>) => {
		info.value = { ...info.value, ...uinfo } as PublicUserInfo;
	};

	const setChats = (uchats: UserChat[]) => {
		chats.value = uchats;
	};

	const setFriends = (ufriends: UserFriend[]) => {
		friends.value = ufriends;
	};

	const setUserData = ({
		info: uinfo,
		chats: uchats,
		friends: ufriends,
	}: {
		info?: PublicUserInfo;
		chats?: UserChat[];
		friends?: UserFriend[];
	}) => {
		info.value = uinfo ?? null;
		chats.value = uchats ?? [];
		friends.value = ufriends ?? [];
	};

	const $reset = () => {
		info.value = null;
		chats.value = [];
		friends.value = [];
	};

	return {
		info,
		chats,
		isChatsLoading,
		friends,
		setInfo,
		setChats,
		setFriends,
		setUserData,
		$reset,
	};
});
