import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { db, getUserDocRef } from '../firestore';

import { FieldValue } from 'firebase-admin/firestore';
import { UserRecord } from 'firebase-admin/auth';

export const addToFriendById = onCall<{ userId: UserRecord['uid'] }>({ region: 'europe-central2' }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'User not authenticated');
  }

  if (typeof request.data?.userId !== 'string') {
    throw new HttpsError('invalid-argument', 'User id id must be a string');
  }

  const userFriends = await getUserDocRef(request.auth.uid, 'private', 'friends').get();
  if (userFriends.data()?.[request.data.userId]) {
    throw new HttpsError('already-exists', 'You are already friends with this user');
  }

  const batch = db.batch();
  const friends = [request.auth.uid, request.data.userId];

  friends.forEach((uid) => {
    const friendId = uid === friends[0] ? friends[1] : friends[0];
    batch.set(
      getUserDocRef(uid, 'private', 'friends'),
      {
        [friendId]: { ref: getUserDocRef(uid), friend_since: FieldValue.serverTimestamp() },
      },
      { merge: true }
    );
  });

  return batch
    .commit()
    .then(() => ({
      success: true,
    }))
    .catch(() => {
      throw new HttpsError('not-found', 'User not found');
    });
});
