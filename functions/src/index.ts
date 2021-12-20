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
            let endgamePoints = 5;
            if (!matchData.hangFail) endgamePoints += 20;
            if (!matchData.levelFail) endgamePoints += 15;
            if (teamData.endgamePoints) {
                newTeamData.endgamePoints =
                    (teamData.endgamePoints * (matches - 1) + endgamePoints) /
                    matches;
            } else {
                newTeamData.endgamePoints = endgamePoints;
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
