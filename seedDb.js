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

const autonFields = [
    "Starting Position:radio Left,Center,Right",
    "Crossed Auto Line:boolean",
    "FUEL Preloaded:counter",
    "FUEL Scored in HUB:slider 0 60",
    "FUEL Missed:slider 0 30",
    "HP FUEL Scored:slider 0 200",
    "Auto Climb Level:radio None,Level 1"
];

const teleopFields = [
    "FUEL Scored in Active HUB:slider 0 200",
    "FUEL Missed:slider 0 100",
    "HP FUEL Scored:slider 0 200",
    "Intake to Score Cycle:timer",
    "Primary Intake Source:radio Floor,Human Player,Both",
    "Shooting Position:radio Close,Mid,Far,Variable",
    "Played Defense:boolean",
    "Defense Rating:selection None,Weak,Average,Strong",
    "Received Defense:boolean",
    "Defense Impact:selection None,Low,Medium,High",
    "Fouls Committed:counter",
    "Broke Down:boolean",
    "Tipped Over:boolean",
    "Teleop Notes:text"
];

const endgameFields = [
    "Attempted Climb:boolean",
    "Final Climb Level:selection None,Level 1,Level 2,Level 3",
    "Climb Time:counter",
    "Parked:boolean",
    "FUEL Scored in End Game:slider 0 100",
    "Match Comments:text"
];

async function seed() {
    await db.collection("years").doc("2026").collection("scouting").doc("auton").set({ autonFields });
    await db.collection("years").doc("2026").collection("scouting").doc("teleop").set({ teleopFields });
    await db.collection("years").doc("2026").collection("scouting").doc("endgame").set({ endgameFields });
    console.log("Done database seed.");
    process.exit(0);
}

seed();
