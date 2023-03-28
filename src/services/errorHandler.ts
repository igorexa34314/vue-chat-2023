import { FirebaseError } from 'firebase/app';

export const fbErrorHandler = (e, msg?: string) => {
	console.error(msg || '', e);
	throw e instanceof FirebaseError ? e.code : e;
};
