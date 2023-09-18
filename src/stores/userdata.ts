import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UserData, UserInfo } from '@/services/user';

export const useUserdataStore = defineStore('userdata', () => {
	const userdata = ref<UserData | null>();

	const $reset = () => {
		userdata.value = null;
	};
	const setUserData = (data: UserData) => {
		userdata.value = data;
	};
	const setUserInfo = (info: UserInfo) => {
		userdata.value = { ...userdata.value, info };
	};
	const getUdata = computed(() => userdata.value ?? null);
	const getUserInfo = computed(() => userdata.value?.info ?? null);
	const getUserChats = computed(() => userdata.value?.chats ?? []);

	return {
		userdata,
		getUdata,
		getUserInfo,
		getUserChats,
		$reset,
		setUserInfo,
		setUserData,
	};
});
