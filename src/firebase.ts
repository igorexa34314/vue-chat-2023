// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import {
	initializeAuth,
	indexedDBLocalPersistence,
	browserLocalPersistence,
	browserSessionPersistence,
	browserPopupRedirectResolver,
} from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { initializeAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
export const firebaseApp = initializeApp({
	apiKey: import.meta.env.VITE_FB_API_KEY,
	authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FB_PROJECT_ID,
	messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FB_APP_ID,
	measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
	storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
});

// Initialize Firebase Authentication and get a reference to the service
export const auth = initializeAuth(firebaseApp, {
	persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
	popupRedirectResolver: browserPopupRedirectResolver,
});

// Initialize Firestore and get a reference to the service
export const db = initializeFirestore(firebaseApp, {});

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(firebaseApp);

export const functions = getFunctions(firebaseApp, 'europe-central2');

export const analytics = initializeAnalytics(firebaseApp);
