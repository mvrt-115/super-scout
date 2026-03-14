const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');

const config = {
    apiKey: "AIzaSyBVYgLi7CnBXVAo4aN0qFbRGFSozXiltHM",
    authDomain: "mvrt115-scout.firebaseapp.com",
    projectId: "mvrt115-scout",
    storageBucket: "mvrt115-scout.appspot.com",
    messagingSenderId: "161834372741",
    appId: "1:161834372741:web:d3d2cab7e92df8209323ec"
};

const app = firebase.initializeApp(config);
const db = app.firestore();

async function check() {
    const doc = await db.collection("years").doc("2025").collection("scouting").doc("auton").get();
    console.log("2025 auton:", JSON.stringify(doc.data(), null, 2));

    const teleop = await db.collection("years").doc("2025").collection("scouting").doc("teleop").get();
    console.log("2025 teleop:", JSON.stringify(teleop.data(), null, 2));
    
    process.exit(0);
}

check();
