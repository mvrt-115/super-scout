import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

const firebaseConfig = {
    apiKey: 'AIzaSyAXhBrr_cmU3udV4NEtmJmGAUt_wAxQ3b8',
    authDomain: 'mvrt115-scout.firebaseapp.com',
    projectId: 'mvrt115-scout',
    storageBucket: 'mvrt115-scout.appspot.com',
    messagingSenderId: '161834372741',
    appId: '1:161834372741:web:d3d2cab7e92df8209323ec',
};
const app = firebase.initializeApp(firebaseConfig);

export const db = app.firestore();

export const auth = app.auth();

export default firebase;
