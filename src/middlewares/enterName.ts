import { AuthService } from '@/services/auth';
import { NavigationGuardWithThis } from 'vue-router/auto';

export const valalidateEnterName: NavigationGuardWithThis<undefined> = async (to, from, next) => {
	const currentUser = await AuthService.getCurrentUser();
	const tokenId = (await currentUser?.getIdTokenResult())?.claims.sub;

	if (tokenId === to.query.tokenId && from.name === '/register') {
		return next();
	} else return next({ path: '/profile' });
};
