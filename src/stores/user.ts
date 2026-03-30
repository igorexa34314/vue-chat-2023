import { defineStore } from 'pinia';
import { readonly, ref, shallowReadonly, shallowRef } from 'vue';
import type { PublicUserInfo, UserChat, UserFriend } from '@/services/user';

export const useUserStore = defineStore('user', () => {
	const info = shallowRef<PublicUserInfo | null>(null);

	const setInfo = (uinfo: Partial<PublicUserInfo>) => {
		info.value = { ...info.value, ...uinfo } as PublicUserInfo;
	};

	const chats = ref<UserChat[]>([]);

	const setChats = (uchats: UserChat[]) => {
		chats.value = uchats;
	};

	const isChatsLoading = ref(false);

	const setChatsLoading = (val: boolean) => {
		isChatsLoading.value = val;
	};

	const friends = shallowRef<UserFriend[]>([]);

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
		info: readonly(info),
		setInfo,
		chats: shallowReadonly(chats),
		setChats,
		isChatsLoading: readonly(isChatsLoading),
		setChatsLoading,
		friends: readonly(friends),
		setFriends,
		setUserData,
		$reset,
	};
});
