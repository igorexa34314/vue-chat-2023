import { getCurrentUser } from '@/services/auth';
import type { NavigationGuard } from 'vue-router';

export const valalidateEnterName: NavigationGuard = async (to, from) => {
	if (to.name !== '/enter-name') {
		return;
	}

	const currentUser = await getCurrentUser();
	const tokenId = (await currentUser?.getIdTokenResult())?.claims.sub;

	if (tokenId === to.query.tokenId && from.name === '/register') {
		return;
	}
	return '/profile';
};
