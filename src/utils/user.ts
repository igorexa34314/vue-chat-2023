import { computed } from 'vue';
import { DisplayUserInfo } from '@/services/user';

export const setUserDisplayName = computed(
	() =>
		({ firstname, lastname }: Pick<DisplayUserInfo, 'firstname' | 'lastname'>) =>
			[firstname, lastname].filter(Boolean).join(' ') || 'Unknown'
);
