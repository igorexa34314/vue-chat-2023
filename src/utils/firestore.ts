import { FirestoreDataConverter, Timestamp, DocumentReference, QueryDocumentSnapshot } from 'firebase/firestore';
import { ParsedTimestamps } from '@/types/db/helpers';

export const parseTimestamp = <T extends object, K extends keyof T>(obj: T): ParsedTimestamps<T> => {
	if (obj instanceof Timestamp) {
		return obj.toDate() as ParsedTimestamps<T>;
	} else if (obj instanceof DocumentReference) {
		return obj as ParsedTimestamps<T>;
	} else if (Array.isArray(obj)) {
		return obj.map(parseTimestamp) as ParsedTimestamps<T>;
	} else if (obj && typeof obj === 'object') {
		return Object.keys(obj).reduce((res, key) => {
			(res[key as K] as ParsedTimestamps<T>) = parseTimestamp(obj[key as K] as any);
			return res;
		}, {} as ParsedTimestamps<T>);
	}
	return obj;
};

export const timestampConverter = <T extends object>(): FirestoreDataConverter<ParsedTimestamps<T>, T> =>
	({
		toFirestore: data => data,
		fromFirestore: (snapshot: QueryDocumentSnapshot<T>, options) => {
			const info = snapshot.data(options);
			return parseTimestamp(info);
		},
	}) as FirestoreDataConverter<ParsedTimestamps<T>, T>;
