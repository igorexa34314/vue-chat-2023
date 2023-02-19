// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
export const firebaseApp = initializeApp({
	apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
	authDomain: 'my-vue-chat-e3718.firebaseapp.com',
	projectId: 'my-vue-chat-e3718',
	storageBucket: 'my-vue-chat-e3718.appspot.com',
	messagingSenderId: '324405358221',
	appId: '1:324405358221:web:057a560cc0306372b67cc4',
	measurementId: 'G-4SFVY2F5RS',
	storageBucket: 'gs://my-vue-chat-e3718.appspot.com'
});

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(firebaseApp);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(firebaseApp);

const analytics = getAnalytics(firebaseApp);
