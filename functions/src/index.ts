/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from 'firebase-functions/logger';
import { region } from 'firebase-functions';
// import { cors } from './cors';

// The Firebase Admin SDK to access Firestore.
import { initializeApp } from 'firebase-admin/app';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentDeleted, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

initializeApp();

const db = getFirestore();

export const createUserProfileTrigger = region('europe-central2')
  .auth.user()
  .onCreate(async (user) => {
    await db
      .collection('users')
      .doc(user.uid)
      .create({
        info: {
          uid: user.uid,
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
    await db.collection('users').doc(user.uid).delete();
    logger.info(`User profile with ${user.uid} deleted`);
  });

export const createSavedChatTrigger = onDocumentCreated(
  { document: 'users/{uid}', region: 'europe-central2' },
  async (event) => {
    const newChatDoc = db.collection('chats').doc();
    await newChatDoc.create({
      id: newChatDoc.id,
      name: 'Saved messages',
      avatar: null,
      description: '',
      type: 'saved',
      created_by: event.params.uid,
      created_at: FieldValue.serverTimestamp(),
      updated_at: null,
    });
    logger.info(`New saved chat for ${event.params.uid} created`);
  }
);

export const deleteUserChatsTrigger = onDocumentDeleted(
  { document: 'users/{uid}', region: 'europe-central2' },
  async (event) => {
    const chatsCol = db.collection('chats');
    // Mutate chats created by this user
    const createdChatDocs = await chatsCol.where('created_by', '==', event.params.uid).get();
    const memberChatDocs = await chatsCol.where('members', 'array-contains', event.params.uid).get();

    const batch = db.batch();

    for (const doc of createdChatDocs.docs.concat(memberChatDocs.docs)) {
      if (doc.data()?.type === 'saved') {
        batch.delete(doc.ref);
      } else if (doc.data().created_by === event.params.uid) {
        batch.update(doc.ref, {
          created_by: 'deleted_user',
        });
      } else {
        batch.update(doc.ref, { members: FieldValue.arrayRemove(event.params.uid) });
      }
    }

    await batch.commit();
    logger.info(`Related chats to user ${event.params.uid} deleted`);
  }
);

export const bindChatsToChatMembersTrigger = onDocumentWritten(
  { document: 'chats/{chatId}', region: 'europe-central2' },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.error('No data associated with the event');
      return;
    }

    const beforeData = snapshot.before.data();
    const afterData = snapshot.after.data();
    const batch = db.batch();

    const usersCol = db.collection('users');
    const eventType = beforeData && afterData ? 'update' : afterData ? 'create' : 'delete';

    const getUserDocsToUpdate = () => {
      const chatCreatorId: string = afterData?.created_by ?? beforeData?.created_by;
      const chatMembersId: string[] = afterData?.members ?? beforeData?.members ?? [];
      return Array.from(new Set([chatCreatorId, ...chatMembersId])).map((id) => usersCol.doc(id));
    };

    switch (eventType) {
      case 'create':
        for (const doc of getUserDocsToUpdate()) {
          batch.update(doc, {
            chats: FieldValue.arrayUnion(afterData?.id ?? snapshot.after.id),
          });
        }
        break;

      case 'update':
        for (const doc of getUserDocsToUpdate()) {
          batch
            .update(doc, {
              chats: FieldValue.arrayUnion(afterData?.id ?? snapshot.after.id),
            })
            .update(doc, {
              chats: FieldValue.arrayRemove(beforeData?.id ?? snapshot.before.id),
            });
        }
        break;

      case 'delete':
        for (const doc of getUserDocsToUpdate()) {
          batch.update(doc, {
            chats: FieldValue.arrayRemove(beforeData?.id ?? snapshot.before.id),
          });
        }
        break;
    }

    await batch.commit();
    logger.info(`Chat members and creator binded to their profiles - ${afterData?.id ?? beforeData?.id}`);
  }
);

const createPrivateChat = async ({ creatorId, companionId }: { creatorId: string; companionId: string }) => {
  const newChatDoc = db.collection('chats').doc();

  const chatInfo = {
    id: newChatDoc.id,
    name: 'Private chat',
    description: '',
    type: 'private',
    avatar: null,
    members: [creatorId, companionId],
    created_by: creatorId,
    created_at: FieldValue.serverTimestamp(),
    updated_at: null,
  };
  await newChatDoc.create(chatInfo);

  const batch = db.batch();

  [creatorId, companionId].forEach((id) => {
    const userDocRef = db.collection('users').doc(id);
    batch.update(userDocRef, {
      chats: FieldValue.arrayUnion(newChatDoc.id),
    });
  });

  return batch
    .commit()
    .then(() => ({
      chatId: newChatDoc.id,
    }))
    .catch(() => {
      throw new HttpsError('not-found', 'User with provided id not found');
    });
};

const getExistingPrivateChatByMembers = async (...[userId, companionId]: string[]) => {
  let chatId: string | null = null;
  const querySnapshot = await db
    .collection('chats')
    .where('type', '==', 'private')
    .where('members', 'array-contains', userId)
    .get();
  querySnapshot.forEach((doc) => {
    if ((doc.data().members as string[]).includes(companionId)) {
      chatId = doc.id;
    }
  });
  return chatId ? { chatId } : null;
};

export const joinPrivateChatByCompanionId = onCall(
  { region: 'europe-central2' },
  async (request: CallableRequest<{ companionId: string }>) => {
    const userId = request.auth?.uid;
    const companionId = request.data.companionId;
    if (!userId) {
      throw new HttpsError('unauthenticated', 'User not authenticated');
    }
    if (typeof companionId !== 'string') {
      throw new HttpsError('invalid-argument', 'Companion id must be a string');
    }

    return (
      (await getExistingPrivateChatByMembers(userId, companionId)) ||
      (await createPrivateChat({ creatorId: userId, companionId }))
    );
  }
);

export const addToFriendById = onCall(
  { region: 'europe-central2' },
  async (request: CallableRequest<{ userId: string }>) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'User not authenticated');
    }

    if (typeof request.data?.userId !== 'string') {
      throw new HttpsError('invalid-argument', 'User id id must be a string');
    }

    const userData = await db.collection('users').doc(request.auth.uid).get();
    if (userData.data()?.members.length && (userData.data()?.members as string[]).includes(request.data.userId)) {
      throw new HttpsError('already-exists', 'You are already friends with this user');
    }

    const batch = db.batch();
    const friends = [request.auth.uid, request.data.userId];

    friends.forEach((id) => {
      batch.update(db.collection('users').doc(id), {
        friends: FieldValue.arrayUnion(id === friends[0] ? friends[1] : friends[0]),
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
  }
);
