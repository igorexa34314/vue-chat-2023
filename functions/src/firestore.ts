// The Firebase Admin SDK to access Firestore.
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { UserData, ChatInfo, ChatType } from './db.types';
import { UserRecord } from 'firebase-admin/auth';

export const app = initializeApp();

export const db = getFirestore();

export function getUserDocRef<U extends UserData = UserData>(uid: UserRecord['uid']): FirebaseFirestore.DocumentReference<U>;
export function getUserDocRef<U extends UserData = UserData, T extends keyof U = keyof U>(
  uid: UserRecord['uid'],
  dataType: T
): FirebaseFirestore.CollectionReference<U[T]>;
export function getUserDocRef<U extends UserData = UserData, T extends keyof U = keyof U, K extends keyof U[T] = keyof U[T]>(
  uid: UserRecord['uid'],
  dataType: T,
  docId: K
): U[T][K];

export function getUserDocRef<
  U extends UserData = UserData,
  T extends keyof U = keyof U,
  K extends keyof U[T] = keyof U[T],
>(uid: UserRecord['uid'], dataType?: T, docId?: K) {
  const userDocRef = db.doc(`users/${uid}`) as FirebaseFirestore.DocumentReference<U>;
  if (!dataType) {
    return userDocRef;
  }
  const userDocRefWithPrivacy = userDocRef.collection(dataType.toString()) as FirebaseFirestore.CollectionReference<
    U[T]
  >;
  return !docId ? userDocRefWithPrivacy : (userDocRefWithPrivacy.doc(docId.toString()) as U[T][K]);
}

export const getChatCol = <T extends ChatType = ChatType>(type?: T) => {
  return db.collection('chats') as FirebaseFirestore.CollectionReference<ChatInfo<T>>;
};
