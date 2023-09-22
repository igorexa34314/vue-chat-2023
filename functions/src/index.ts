/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from 'firebase-functions/logger';
import { Change, region } from 'firebase-functions';
// import { cors } from './cors';

// The Firebase Admin SDK to access Firestore.
import { initializeApp } from 'firebase-admin/app';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentDeleted, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { DocumentSnapshot, FieldValue, getFirestore } from 'firebase-admin/firestore';

import { UserData, ChatInfo, ChatType } from './db.types';
import { UserRecord } from 'firebase-admin/auth';

initializeApp();

const db = getFirestore();

const getUserDocRef = (uid: string) => {
  return (db.collection('users') as FirebaseFirestore.CollectionReference<UserData>).doc(uid);
};

const getChatCol = <T extends ChatType = ChatType>(type?: T) => {
  return db.collection('chats') as FirebaseFirestore.CollectionReference<ChatInfo<T>>;
};

export const createUserProfileTrigger = region('europe-central2')
  .auth.user()
  .onCreate(async (user) => {
    await getUserDocRef(user.uid).create({
      info: {
        displayName: user.displayName || user.email?.split('@').at(0) || `user-${user.uid.split('-').at(0)}`,
        gender: 'unknown',
        email: user.email ?? '',
        phoneNumber: user.phoneNumber || null,
        photoURL: user.photoURL || null,
        birthday_date: null,
        created_at: FieldValue.serverTimestamp(),
        updated_at: null,
      },
      chats: [],
      friends: [],
    });
    logger.info(`User profile with ${user.uid} created`);
  });

export const deleteUserProfileTrigger = region('europe-central2')
  .auth.user()
  .onDelete(async (user) => {
    await getUserDocRef(user.uid).delete();
    logger.info(`User profile with ${user.uid} deleted`);
  });

export const createSavedChatTrigger = onDocumentCreated(
  { document: 'users/{uid}', region: 'europe-central2' },
  async (event) => {
    await getChatCol('saved').add({
      name: 'Saved messages',
      avatar: null,
      description: '',
      type: 'saved',
      created_by: getUserDocRef(event.params.uid),
      created_at: FieldValue.serverTimestamp(),
      updated_at: null,
    });
    logger.info(`New saved chat for ${event.params.uid} created`);
  }
);

export const deleteUserChatsTrigger = onDocumentDeleted(
  { document: 'users/{uid}', region: 'europe-central2' },
  async (event) => {
    const chatsCol = getChatCol();
    // Mutate chats created by this user
    const createdChatDocs = await chatsCol.where('created_by', '==', getUserDocRef(event.params.uid)).get();
    const memberChatDocs = await chatsCol.where('members', 'array-contains', getUserDocRef(event.params.uid)).get();

    const batch = db.batch();

    for (const doc of createdChatDocs.docs.concat(memberChatDocs.docs)) {
      if (doc.data()?.type === 'saved') {
        batch.delete(doc.ref);
      } else if (doc.data().created_by.id === event.params.uid) {
        batch.update(doc.ref, {
          // @ts-ignore
          created_by: 'deleted_user',
        });
      } else {
        batch.update(doc.ref, { members: FieldValue.arrayRemove(getUserDocRef(event.params.uid)) });
      }
    }

    await batch.commit();
    logger.info(`Related chats to user ${event.params.uid} deleted`);
  }
);

export const bindChatsToChatMembersTrigger = onDocumentWritten(
  { document: 'chats/{chatId}', region: 'europe-central2' },
  async (event) => {
    const snapshot = event.data as Change<DocumentSnapshot<ChatInfo>> | undefined;
    if (!snapshot) {
      logger.error('No data associated with the event');
      return;
    }

    const beforeSnap = snapshot.before;
    const afterSnap = snapshot.after;
    const batch = db.batch();

    const eventType = beforeSnap && afterSnap ? 'update' : afterSnap ? 'create' : 'delete';

    const getUserDocsToUpdate = () => {
      const chatCreatorDocRef = (afterSnap.data()?.created_by ?? beforeSnap.data()?.created_by)!;
      const chatMembersDocsRef = afterSnap.data()?.members ?? beforeSnap.data()?.members ?? [];
      return Array.from(new Set([chatCreatorDocRef.id, ...chatMembersDocsRef.map((doc) => doc.id)])).map(getUserDocRef);
    };

    switch (eventType) {
      case 'create':
        for (const doc of getUserDocsToUpdate()) {
          batch.update(doc, {
            chats: FieldValue.arrayUnion(afterSnap.ref),
          });
        }
        break;

      case 'update':
        for (const doc of getUserDocsToUpdate()) {
          batch
            .update(doc, {
              chats: FieldValue.arrayUnion(afterSnap.ref),
            })
            .update(doc, {
              chats: FieldValue.arrayRemove(beforeSnap.ref),
            });
        }
        break;

      case 'delete':
        for (const doc of getUserDocsToUpdate()) {
          batch.update(doc, {
            chats: FieldValue.arrayRemove(beforeSnap.ref),
          });
        }
        break;
    }

    await batch.commit();
    logger.info(`Chat members and creator binded to their profiles - ${afterSnap.id ?? beforeSnap.id}`);
  }
);

const createPrivateChat = async (creatorId: UserRecord['uid'], companionId: UserRecord['uid']) => {
  const newChatDoc = await getChatCol('private').add({
    name: 'Private chat',
    description: '',
    type: 'private',
    avatar: null,
    members: [creatorId, companionId].map(getUserDocRef),
    created_by: getUserDocRef(creatorId),
    created_at: FieldValue.serverTimestamp(),
    updated_at: null,
  });

  return {
    chatId: newChatDoc.id,
  };
};

const getExistingPrivateChatByMembers = async (...[userId, companionId]: UserRecord['uid'][]) => {
  let chatId: string | null = null;
  const querySnapshot = await getChatCol('private')
    .where('type', '==', 'private')
    .where('members', 'array-contains', getUserDocRef(userId))
    .get();
  const companionDocRef = getUserDocRef(companionId);
  querySnapshot.forEach((doc) => {
    if (doc.data().members.some((m) => m.isEqual(companionDocRef))) {
      chatId = doc.id;
    }
  });
  return chatId ? { chatId } : null;
};

export const joinPrivateChatByCompanionId = onCall<{ companionId: UserRecord['uid'] }>(
  { region: 'europe-central2' },
  async (request) => {
    const userId = request.auth?.uid;
    const companionId = request.data.companionId;
    if (!userId) {
      throw new HttpsError('unauthenticated', 'User not authenticated');
    }
    if (typeof companionId !== 'string') {
      throw new HttpsError('invalid-argument', 'Companion id must be a string');
    }

    return (
      (await getExistingPrivateChatByMembers(userId, companionId)) || (await createPrivateChat(userId, companionId))
    );
  }
);

export const addToFriendById = onCall<{ userId: UserRecord['uid'] }>({ region: 'europe-central2' }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'User not authenticated');
  }

  if (typeof request.data?.userId !== 'string') {
    throw new HttpsError('invalid-argument', 'User id id must be a string');
  }

  const userData = await getUserDocRef(request.auth.uid).get();
  if (userData.data()?.friends.length && userData.data()?.friends.includes(getUserDocRef(request.data.userId))) {
    throw new HttpsError('already-exists', 'You are already friends with this user');
  }

  const batch = db.batch();
  const friends = [request.auth.uid, request.data.userId].map(getUserDocRef);

  friends.forEach((userDocRef) => {
    batch.update(userDocRef, {
      friends: FieldValue.arrayUnion(userDocRef.id === friends[0].id ? friends[1] : friends[0]),
    });
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
