import * as logger from 'firebase-functions/logger';
import { Change } from 'firebase-functions';
// import { cors } from './cors';

import { db, getUserDocRef, getChatCol } from '../firestore';
import { onDocumentCreated, onDocumentDeleted, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { DocumentSnapshot, FieldValue } from 'firebase-admin/firestore';

import { UserRecord } from 'firebase-admin/auth';
import { ChatInfo } from '../db.types';

const createSavedChat = async (uid: UserRecord['uid']) => {
  await getChatCol('saved').add({
    name: 'Saved messages',
    avatar: null,
    description: '',
    type: 'saved',
    created_by: getUserDocRef(uid),
    created_at: FieldValue.serverTimestamp(),
    updated_at: null,
  });
  logger.info(`New saved chat for ${uid} created`);
};

export const createSavedChatTrigger = onDocumentCreated(
  { document: 'users/{uid}', region: 'europe-central2' },
  async (event) => createSavedChat(event.params.uid)
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
          created_by: 'deleted_user' as any,
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

    const eventType = beforeSnap.exists && afterSnap.exists ? 'update' : afterSnap.exists ? 'create' : 'delete';

    const userChatDocsToUpdate = (() => {
      const chatCreatorDocRef = (afterSnap.data()?.created_by ?? beforeSnap.data()?.created_by)!;
      const chatMembersDocsRef = afterSnap.data()?.members ?? beforeSnap.data()?.members ?? [];
      return Array.from(new Set([chatCreatorDocRef.id, ...chatMembersDocsRef.map((doc) => doc.id)])).map((uid) =>
        getUserDocRef(uid, 'private', 'chats')
      );
    })();

    switch (eventType) {
      case 'create':
      case 'update':
        userChatDocsToUpdate.forEach((doc) => {
          batch.set(
            doc,
            {
              [afterSnap.ref.id]: { ref: afterSnap.ref, member_since: FieldValue.serverTimestamp() },
            },
            { merge: true }
          );
        });
        break;

      case 'delete':
        userChatDocsToUpdate.forEach((doc) => {
          batch.update(doc, {
            [beforeSnap.ref.id]: FieldValue.delete(),
          });
        });
        break;
    }

    await batch.commit();
    logger.info(`Chat members and creator binded to their profiles - ${afterSnap.id ?? beforeSnap.id}`);
  }
);
