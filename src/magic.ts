import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/functions';

interface FirebaseConfig {
    apiKey: string | undefined;
    authDomain: string | undefined;
    projectId: string | undefined;
    storageBucket: string | undefined;
    messagingSenderId: string | undefined;
    appId: string | undefined;
}

const config: FirebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
};
const app = firebase.initializeApp(config);
const db = app.firestore();
//export const db = app.firestore();

export const auth = app.auth();

export const functions = app.functions();

export default firebase;

