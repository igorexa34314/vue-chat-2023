import { Timestamp } from 'firebase/firestore';

export type ParsedTimestamps<T extends { [key: string]: any }> = {
	[K in keyof T]: Extract<T[K], Timestamp> extends never ? T[K] : Date | Exclude<T[K], Timestamp>;
};

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
