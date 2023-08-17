import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UserData, UserInfo } from '@/types/db/UserdataTable';

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
	const getUdata = computed(() => userdata.value);
	const getUInfo = computed(() => userdata.value?.info);
	const getUChats = computed(() => userdata.value?.chats);

	return {
		userdata,
		getUdata,
		getUInfo,
		getUChats,
		$reset,
		setUserInfo,
		setUserData
	};
});
