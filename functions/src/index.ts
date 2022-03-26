import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FunctionsErrorCode } from 'firebase-functions/v1/https';

// const functions = require('firebase-functions');
// const admin = require('firebase-admin');

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

admin.initializeApp();
const db = admin.firestore();

export const matchUpdate = functions.firestore
    .document('/years/{year}/regionals/{regional}/teams/{team}/matches/{match}')
    .onCreate(async (snap, context) => {
        functions.logger.log('firebase functions!!!');
        const teamDoc = await db
            .collection('years')
            .doc(context.params.year)
            .collection('regionals')
            .doc(context.params.regional)
            .collection('teams')
            .doc(context.params.team)
            .get();
        const teamData = teamDoc.data() || {};
        const matchData = snap.data();
        let newTeamData: any = {};
        let matches = (
            await db
                .collection('years')
                .doc(context.params.year)
                .collection('regionals')
                .doc(context.params.regional)
                .collection('teams')
                .doc(context.params.team)
                .collection('matches')
                .get()
        ).docs.length;
        newTeamData["teamNum"] = context.params.team;
        functions.logger.info(teamData);
        Object.keys(matchData).forEach((key) => {
            if (
                key !== 'matchNum' &&
                key !== 'teamNum' &&
                typeof matchData[key] === 'number'
            ) {
                if (teamData[key]!==undefined) {
                    const value =
                        teamData[key] * (matches - 1) + matchData[key];
                    newTeamData[key] = value / matches;
                } else {
                    newTeamData[key] = matchData[key];
                }
            }
            let endgamePoints = calcEndgamePoints(
                matchData,
                context.params.year,
            );
            let autonPoints = calcAutonPoints(matchData, context.params.year);
            let teleopPoints = calcTeleopPoints(matchData, context.params.year);

            if (teamData.endgamePoints !== undefined) {
                newTeamData.endgamePoints =
                    (teamData.endgamePoints * (matches - 1) + endgamePoints) /
                    matches;
            } else {
                newTeamData.endgamePoints = endgamePoints;
            }

            if (teamData.autonPoints !== undefined) {
                newTeamData.autonPoints =
                    (teamData.autonPoints * (matches - 1) + autonPoints) /
                    matches;
            } else {
                newTeamData.autonPoints = autonPoints;
            }

            if (teamData.teleopPoints !== undefined) {
                newTeamData.teleopPoints =
                    (teamData.teleopPoints * (matches - 1) + teleopPoints) /
                    matches;
            } else {
                newTeamData.teleopPoints = teleopPoints;
            }
        });
        newTeamData.matches = matches;
        if(!teamData["Suggest To Picklist"] && matchData["Suggest To Picklist"]){
            newTeamData["Suggest To Picklist"] = true;
        }   
        // functions.logger.info(newTeamData);
        db.collection('years')
            .doc(context.params.year)
            .collection('regionals')
            .doc(context.params.regional)
            .collection('teams')
            .doc(context.params.team)
            .set(newTeamData);
    });

const calcAutonPoints = (matchData: any, year: number | string) => {
    if (year == '2019') {
        return matchData.autonBottom * 2 +
            matchData.autonUpper * 4 +
            matchData.autonInner * 6 +
            matchData.crossedInitLine
            ? 5
            : 0;
    } else if (year == '2022') {
        return (
            matchData['Auton Bottom'] * 2 +
            matchData['Auton Upper'] * 4 +
            2 * +matchData['Leave Tarmac']
        );
    }
    return -1;
};

const calcTeleopPoints = (matchData: any, year: number | string) => {
    if (year == '2019') {
        return (
            matchData.teleopBottom +
            matchData.teleopUpper * 2 +
            matchData.teleopInner * 4
        );
    } else if (year == '2022') {
        return matchData['Teleop Bottom'] + matchData['Teleop Upper'] * 2;
    }
    return -1;
};

const calcEndgamePoints = (matchData: any, year: number | string) => {
    if (year == '2019') {
        let endgamePoints = 5;
        if (!matchData.hangFail) endgamePoints += 20;
        if (!matchData.levelFail) endgamePoints += 15;
        return endgamePoints;
    } else if (year == '2022') {
        let climbScore: number = 0;
        switch (matchData['Climb rung']) {
            case 'Low':
                climbScore = 4;
                break;
            case 'Mid':
                climbScore = 6;
                break;
            case 'High':
                climbScore = 10;
                break;
            case 'Traversal':
                climbScore = 15;
                break;
            default:
                climbScore = 0;
        }
        return climbScore;
    }
    return -1;
};

/*
const minAutonPoints = async (context: functions.EventContext, currAutonPoints: number) => {
    let minAutonPoints: number = Number.MAX_VALUE;
    await db
        .collection('years')
        .doc(context.params.year)
        .collection('regionals')
        .doc(context.params.regional)
        .collection('teams')
        .doc(context.params.team)
        .collection('matches')
        .get().then((matches) => {
            matches.docs.forEach(async (match) => {
                let curr = (2 * await match.data()['Auton Bottom']) 
                + (4 * await match.data()['Auton Upper']) 
                + (2 * await +match.data()['Leave Tarmac']);
                minAutonPoints = Math.min(currAutonPoints, curr);
            });
        });
    return minAutonPoints;
}

const minTeleopPoints = async (context: functions.EventContext, currTeleopPoints: number) => {
    let minTeleopPoints: number = Number.MAX_VALUE;
    await db
        .collection('years')
        .doc(context.params.year)
        .collection('regionals')
        .doc(context.params.regional)
        .collection('teams')
        .doc(context.params.team)
        .collection('matches')
        .get().then((matches) => {
            matches.docs.forEach(async (match) => {
                let curr = (1 * await match.data()['Teleop Upper']) 
                + (2 * await match.data()['Teleop Bottom']) 
                minTeleopPoints = Math.min(currTeleopPoints, curr);
            });
        });
    return minTeleopPoints;
}

const minPostGamePoints = async(context: functions.EventContext, currPostGamePoints: number) => {
    let minPostGamePoints: number = Number.MAX_VALUE;
    await db
    .collection('years')
    .doc(context.params.year)
    .collection('regionals')
    .doc(context.params.regional)
    .collection('teams')
    .doc(context.params.team)
    .collection('matches')
    .get().then((matches) => {
        matches.docs.forEach(async (match) => {
            let curr : number = 0;
            switch((await match.data()['Climb rung'])) {
                case "Low":
                    curr = 4;
                    break;
                case "Mid":
                    curr = 6;
                    break;
                case "High":
                    curr = 10;
                    break;
                case "Traversal":
                    curr = 15;
                    break;
                default: 
                    break;
            }
            minPostGamePoints = Math.min(currPostGamePoints, curr);
        });
    });
    return minPostGamePoints;
}

const maxAutonPoints = (context: functions.EventContext, currMaxAutonPoints: number) => {

}

const maxTeleopPoints = (context: functions.EventContext, currMaxTeleopPoints: number) => {

}

const maxPostGamePoints = (context: functions.EventContext, currPostGamePoints: number) => {

}
*/
export const calculatePoints = functions.https.onCall(async (data, context) => {
    const { year, regional, team, match } = data;

    let matchRef = await db
        .collection('years')
        .doc(year)
        .collection('regionals')
        .doc(regional)
        .collection('teams')
        .doc(team)
        .collection('matches')
        .doc(match)
        .get();
    let matchData = matchRef.data();
    let autonPoints = calcAutonPoints(matchData, year);
    let teleopPoints = calcTeleopPoints(matchData, year);
    let endgamePoints = calcEndgamePoints(matchData, year);

    return {
        autonPoints,
        teleopPoints,
        endgamePoints,
    };
});