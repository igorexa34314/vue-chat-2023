import { app } from './firestore';
import { getStorage } from 'firebase-admin/storage';

export const storage = getStorage(app);
export const publicBucket = storage.bucket(process.env.FB_PUBLIC_BUCKET);
export const chatDataBucket = storage.bucket(process.env.FB_CHAT_DATA_BUCKET);
