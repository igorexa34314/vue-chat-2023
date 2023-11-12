import { Change, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { DocumentSnapshot } from 'firebase-admin/firestore';
import { UserInfo } from '../db.types';
import { index } from './client';
import * as logger from 'firebase-functions/logger';

export const addRecordsToAlgoliaIndexTrigger = onDocumentWritten(
  { document: 'users/{userId}/public/info', region: 'europe-central2' },
  async (event) => {
    const snapshot = event.data as Change<DocumentSnapshot<UserInfo>> | undefined;
    if (!snapshot) {
      logger.error('No data associated with the event');
      return;
    }

    const beforeSnap = snapshot.before;
    const afterSnap = snapshot.after;

    const eventType = !afterSnap.exists ? 'delete' : !beforeSnap.exists ? 'update' : 'create';

    switch (eventType) {
      case 'create':
        await index.partialUpdateObject(
          {
            objectID: event.params.userId,
            ...afterSnap.data(),
          },
          { createIfNotExists: true }
        );
        break;

      case 'update':
        await index.partialUpdateObject(
          {
            objectID: event.params.userId,
            ...afterSnap.data(),
          },
          { createIfNotExists: true }
        );
        break;

      case 'delete':
        await index.deleteObject(event.params.userId);
        break;

      default:
        throw new Error(`Invalid event change type ${eventType}`);
    }

    logger.info(`User ${eventType} with ${event.params.userId} succesfully indexed`);
  }
);
