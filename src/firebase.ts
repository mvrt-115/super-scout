import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyDRUqrPOkZThzbkquxEtVPTJLiHECqU3qU',
    authDomain: 'mvrt-super-scout.firebaseapp.com',
    projectId: 'mvrt-super-scout',
    storageBucket: 'mvrt-super-scout.appspot.com',
    messagingSenderId: '815801961451',
    appId: '1:815801961451:web:d62ca1612492aeae30e7ae',
    measurementId: 'G-M2ZNQKJ44V',
};
const app = firebase.initializeApp(firebaseConfig);

export const db = app.firestore();

export default firebase;
