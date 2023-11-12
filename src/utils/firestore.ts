import {
	Timestamp,
	DocumentReference,
	QueryDocumentSnapshot,
	type FirestoreDataConverter,
	type DocumentData,
} from 'firebase/firestore';
import type { ParsedTimestamps } from '@/types/db/helpers';

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

export const timestampConverter = <
	T extends DocumentData,
	Parsed extends ParsedTimestamps<T> = ParsedTimestamps<T>,
>(): FirestoreDataConverter<Parsed, T> =>
	({
		toFirestore: data => data,
		fromFirestore: (snapshot: QueryDocumentSnapshot<T>, options) => {
			const info = snapshot.data(options);
			return parseTimestamp(info);
		},
	}) as FirestoreDataConverter<Parsed, T>;

export const withIdConverter = <
	T extends DocumentData,
	WithId extends ParsedTimestamps<T> & { id: DocumentReference['id'] } = ParsedTimestamps<T> & {
		id: DocumentReference['id'];
	},
>(): FirestoreDataConverter<WithId, T> => {
	const tc = timestampConverter<T>();
	return {
		toFirestore: ({ id, ...data }: WithId) => tc.toFirestore(data as unknown as T),
		fromFirestore: (snapshot: QueryDocumentSnapshot<WithId, T>, options) => {
			const data = tc.fromFirestore(snapshot, options);
			return { ...data, id: snapshot.ref.id } as WithId;
		},
	};
};
