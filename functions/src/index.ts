import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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
        functions.logger.info(newTeamData);
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
    }
    return -1;
};

const calcEndgamePoints = (matchData: any, year: number | string) => {
    if (year == '2019') {
        let endgamePoints = 5;
        if (!matchData.hangFail) endgamePoints += 20;
        if (!matchData.levelFail) endgamePoints += 15;
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
