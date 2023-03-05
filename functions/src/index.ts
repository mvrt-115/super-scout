import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// const functions = require('firebase-functions');
// const admin = require('firebase-admin');

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typ    escript
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
        functions.logger.info('firebase functions!!!');
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
                if (teamData[key]) {
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

            if (teamData.endgamePoints) {
                newTeamData.endgamePoints =
                    (teamData.endgamePoints * (matches - 1) + endgamePoints) /
                    matches;
            } else {
                newTeamData.endgamePoints = endgamePoints;
            }

            if (teamData.autonPoints) {
                newTeamData.autonPoints =
                    (teamData.autonPoints * (matches - 1) + autonPoints) /
                    matches;
            } else {
                newTeamData.autonPoints = autonPoints;
            }

            if (teamData.teleopPoints) {
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
        let autonPoints : number = 0;
        autonPoints += (2 * matchData['Auton Bottom']) + (4 * matchData['Auton Upper']);
        if(matchData['Left Tarmac'] === undefined) 
            autonPoints += (2 * +matchData['Leave Tarmac']);
        else autonPoints += (2 * +matchData['Left Tarmac'])
        return autonPoints;
    }
    else if(year=='2023'){
        let autonPoints: number = 6*(matchData['Auton Upper Cone']+matchData['Auton Upper Cube'])+4*(matchData['Auton Mid Cone']+matchData['Auton Mid Cube'])+3*(matchData['Auton Lower Cube']+matchData['Auton Lower Cone'])
        if(matchData['Auton Engaged']){
            autonPoints+=12;
        }
        else if(matchData['Auton Docked']){
            autonPoints+=8;
        }
        if(matchData["Mobility"]){
            autonPoints+=3;
        }
        return autonPoints;
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
    else if(year=='2023'){
        return 5*(matchData['Teleop Upper Cone']+matchData['Teleop Upper Cube'])+3*(matchData['Teleop Mid Cone']+matchData['Teleop Mid Cube'])+2*(matchData['Teleop Lower Cone']+matchData['Teleop Lower Cube']);
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
    else if(year='2023'){
        let endgamePoints: number = 0;
        if(matchData['Endgame Engaged']){
            endgamePoints+=10;
        }
        else if(matchData['Endgame Docked']){
            endgamePoints+=6;
        }
        if(matchData['Parked']){
            endgamePoints+=2;
        }
        return endgamePoints;
    }
    return -1;
};

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

export const resetData = functions.https.onCall(async (data, context) => {
    const { year, regional, team } = data;
    let matchCount: number = 0;
    let newData: any = {};
    await (db
        .collection('years')
        .doc(year)
        .collection('regionals')
        .doc(regional)
        .collection('teams')
        .doc(team)
        .collection('matches')
        .get()
        .then((data) => {
            matchCount = data.docs.length;
            data.docs.forEach((match) => {
                const matchData = match.data();
                const keys = Object.keys(matchData || {});
                Object.values(matchData || {}).forEach((value: string | number | boolean, index: number) => {
                    if (typeof value === 'number' && keys[index] !== 'matchNum') {
                        if (newData[keys[index]] === undefined) newData[keys[index]] = value;
                        else newData[keys[index]] += value;
                    }
                });
                const autonPoints = calcAutonPoints(matchData, 2022);
                if(newData['autonPoints']) newData.autonPoints += autonPoints;
                else newData['autonPoints'] = autonPoints;
                const teleopPoints = calcTeleopPoints(matchData, 2022);
                if(newData['teleopPoints']) newData.teleopPoints += teleopPoints;
                else newData['teleopPoints'] = teleopPoints;
                const endgamePoints = calcEndgamePoints(matchData, 2022);
                if(newData['endgamePoints']) newData.endgamePoints += endgamePoints;
                else newData['endgamePoints'] = endgamePoints;
            });
        }));
    Object.keys(newData).forEach((key: string) => newData[key] = (Math.floor((newData[key] / matchCount) * 1000)) / 1000);
    newData.teamNum = team;
    return newData;
});

//module.exports = {calcAutonPoints, calcTeleopPoints, calcEndgamePoints} ;