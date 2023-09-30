import { Timestamp, DocumentReference } from 'firebase/firestore';

export type ParsedTimestamps<T extends object> = {
	[K in keyof T]: Extract<T[K], Timestamp> extends never
		? T[K] extends object
			? T[K] extends DocumentReference
				? T[K]
				: ParsedTimestamps<T[K]>
			: T[K]
		: Date | Exclude<T[K], Timestamp>;
};

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
