// import { cors } from './cors';

import * as logger from 'firebase-functions/logger';
import { region } from 'firebase-functions';

import { db } from '../firestore';
import { publicBucket } from '../storage';
import { FieldValue } from 'firebase-admin/firestore';
import { deleteDocumentWithNestedCols } from '../utils';
import { UserData } from '../db.types';
import { UserRecord } from 'firebase-admin/auth';

function getUserDocRef<U extends UserData = UserData>(uid: UserRecord['uid']): FirebaseFirestore.DocumentReference<U>;
function getUserDocRef<U extends UserData = UserData, T extends keyof U = keyof U>(
  uid: UserRecord['uid'],
  dataType: T
): FirebaseFirestore.CollectionReference<U[T]>;
function getUserDocRef<U extends UserData = UserData, T extends keyof U = keyof U, K extends keyof U[T] = keyof U[T]>(
  uid: UserRecord['uid'],
  dataType: T,
  docId: K
): U[T][K];

function getUserDocRef<U extends UserData = UserData, T extends keyof U = keyof U, K extends keyof U[T] = keyof U[T]>(
  uid: UserRecord['uid'],
  dataType?: T,
  docId?: K
) {
  const userDocRef = db.doc(`users/${uid}`) as FirebaseFirestore.DocumentReference<U>;
  if (!dataType) {
    return userDocRef;
  }
  const userDocRefWithPrivacy = userDocRef.collection(dataType.toString()) as FirebaseFirestore.CollectionReference<
    U[T]
  >;
  return !docId ? userDocRefWithPrivacy : (userDocRefWithPrivacy.doc(docId.toString()) as U[T][K]);
}

export const createUserProfileTrigger = region('europe-central2')
  .auth.user()
  .onCreate(async (user) => {
    const batch = db.batch();
    batch
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      .set(getUserDocRef(user.uid), {} as any)
      .create(getUserDocRef(user.uid, 'public', 'info'), {
        uid: user.uid,
        firstname: user.displayName?.split(' ').at(0) || user.email?.split('@').at(0) || `user-${user.uid.slice(0, 8)}`,
        lastname: user.displayName?.split(' ').at(1) || '',
        gender: 'unknown',
        photoURL: user.photoURL || null,
        birthday_date: null,
        created_at: FieldValue.serverTimestamp(),
        updated_at: null,
      })
      .create(getUserDocRef(user.uid, 'private', 'security'), {
        email: user.email ?? '',
        phoneNumber: user.phoneNumber || null,
      })
      .create(getUserDocRef(user.uid, 'private', 'chats'), {})
      .create(getUserDocRef(user.uid, 'private', 'friends'), {});

    await batch.commit();
    logger.info(`User profile with ${user.uid} created`);
  });

export const deleteUserProfileTrigger = region('europe-central2')
  .auth.user()
  .onDelete(async (user) => {
    await deleteDocumentWithNestedCols(getUserDocRef(user.uid));
    await publicBucket.deleteFiles({
      prefix: `users/${user.uid}`,
    });
    logger.info(`User profile with ${user.uid} deleted`);
  });
