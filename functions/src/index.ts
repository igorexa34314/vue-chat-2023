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

// The Firebase Admin SDK to access Firestore.
import { initializeApp } from 'firebase-admin/app';
import { onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
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
      type: 'self',
      created_by: event.params.uid,
      created_at: FieldValue.serverTimestamp(),
    });
    logger.info(`New self chat profile for ${event.params.uid} created`);
  }
);

export const deleteUserChatsTrigger = onDocumentDeleted(
  { document: 'users/{uid}', region: 'europe-central2' },
  async (event) => {
    const chatDocs = await db.collection('chats').where('created_by', '==', event.params.uid).get();
    const deletePromises: Promise<void>[] = [];

    chatDocs.forEach((doc) => {
      deletePromises.push(
        (async () => {
          if (doc.data()?.type === 'self') {
            await doc.ref.delete();
          } else {
            await doc.ref.update({
              created_at: 'deleted_user',
            });
          }
        })()
      );
    });

    await Promise.all(deletePromises);

    logger.info(`Related chats to user ${event.params.uid} deleted`);
  }
);

export const bindChatToCreatorTrigger = onDocumentCreated(
  { document: 'chats/{chatId}', region: 'europe-central2' },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.error('No data associated with the event');
      return;
    }

    const data = snapshot.data();

    await db
      .collection('users')
      .doc(data.created_by)
      .update({
        chats: FieldValue.arrayUnion(event.params.chatId),
      });

    logger.info(`Chat added to creator profile info with id - ${data.created_by}`);
  }
);
