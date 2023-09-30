// import { cors } from './cors';

import { getChatCol, getUserDocRef } from '../firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';

import { UserRecord } from 'firebase-admin/auth';

const createPrivateChat = async (creatorId: UserRecord['uid'], companionId: UserRecord['uid']) => {
  const newChatDoc = await getChatCol('private').add({
    name: 'Private chat',
    description: '',
    type: 'private',
    avatar: null,
    members: [creatorId, companionId].map((uid) => getUserDocRef(uid)),
    created_by: getUserDocRef(creatorId),
    created_at: FieldValue.serverTimestamp(),
    updated_at: null,
  });

  return {
    chatId: newChatDoc.id,
  };
};

const getExistingPrivateChatByMembers = async (
  ...[userId, companionId]: UserRecord['uid'][]
): Promise<{
  exists: boolean;
  chatId: string | null;
}> => {
  const querySnapshot = await getChatCol('private')
    .where('type', '==', 'private')
    .where('members', 'array-contains', getUserDocRef(userId))
    .where(
      'created_by',
      'in',
      [userId, companionId].map((uid) => getUserDocRef(uid))
    )
    .get();
  const companionDocRef = getUserDocRef(companionId);
  for (const doc of querySnapshot.docs) {
    if (doc.data().members.some((m) => m.isEqual(companionDocRef))) {
      return {
        exists: true,
        chatId: doc.id,
      };
    }
  }
  return { exists: false, chatId: null };
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

    const { exists, chatId } = await getExistingPrivateChatByMembers(userId, companionId);
    return (exists ? { exists, chatId } : { exists, ...(await createPrivateChat(userId, companionId)) }) as {
      exists: boolean;
      chatId: string;
    };
  }
);
