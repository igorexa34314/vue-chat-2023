import { Timestamp } from 'firebase/firestore';

export const timestampToDate = <T extends { [key: string]: Timestamp | null | undefined }>(object: T) => {
	return Object.assign(
		{},
		...Object.keys(object).map(key => ({
			[key]: object[key]?.toDate() ?? object[key],
		}))
	) as { [K in keyof T]: Date };
};
