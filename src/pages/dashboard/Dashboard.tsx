import React, { FC, useEffect } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import DashboardHome from './DashboardHome';
import RegionalData from './RegionalData';
import TeamData from './TeamData';
import Teams from './Teams';
import './Dashboard.css';
import { Heading } from '@chakra-ui/react';
import { db } from '../../firebase';

interface DashboardProps { }

const Dashboard: FC<DashboardProps> = () => {

    const correctData = async () => {
        let teamTemplate = await db.collection('years').doc('2022').collection('regionals').doc('casf').collection('teams');
        (await teamTemplate.get()).docs.forEach(async (doc) => {
            const autonVals = await doc.get('autonPoints');
            const teleopVals = await doc.get('teleopPoints');
            let avgAutonPoints = 0, avgTeleopPoints = 0;
            if (isNaN(autonVals)) {
                const matches = teamTemplate.doc(doc.id).collection('matches').get();
                let totalAutonPoints: number = 0;
                let matchCount = await (await matches).docs.length;
                (await matches).docs.forEach((match) => {
                    totalAutonPoints += ((2 * match.get('Auton Bottom')) + (4 * match.get('Auton Upper')));
                    if (match.get('Left Tarmac') === undefined) {
                        totalAutonPoints += (2 * +match.get('Leave Tarmac'));
                    } else {
                        totalAutonPoints += (2 * +match.get('Left Tarmac'));
                    }
                });
                console.log(totalAutonPoints);
                console.log(matchCount);
                avgAutonPoints = totalAutonPoints / matchCount;
            } else {
                avgAutonPoints = autonVals;
            }
            const matches = teamTemplate.doc(doc.id).collection('matches').get();
            let totalTeleopPoints: number = 0;
            let matchCount = (await matches).docs.length;
            (await matches).docs.forEach((match) => {
                totalTeleopPoints += ((match.get('Teleop Bottom')) + (2 * match.get('Teleop Upper')));
            });
            console.log(totalTeleopPoints);
            console.log(matchCount);
            avgTeleopPoints = totalTeleopPoints / matchCount;

            let endgamePoints = await doc.get('endgamePoints');
            if (endgamePoints === 0) {
                let climbScore: number = 0;
                const matches = teamTemplate.doc(doc.id).collection('matches').get();
                const matchCount = (await matches).docs.length;
                (await matches).docs.forEach((match) => {
                    switch (match.get('Climb rung')) {
                        case 'Low':
                            climbScore += 4;
                            break;
                        case 'Mid':
                            climbScore += 6;
                            break;
                        case 'High':
                            climbScore += 10;
                            break;
                        case 'Traversal':
                            climbScore += 15;
                            break;
                    }
                });
                endgamePoints = climbScore / matchCount;
            }
            teamTemplate.doc(doc.id).set({
                autonPoints: avgAutonPoints,
                teleopPoints: avgTeleopPoints,
                endgamePoints: endgamePoints,
                teamNum: doc.get('teamNum'),
                matches: doc.get('matches')
            });
        })
    }

    useEffect(() => {
        correctData();
    }, [])
    const match = useRouteMatch();
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80%',
                justifySelf: 'center',
                marginLeft: '10%',
            }}
        >
            <Heading marginBottom={'3%'} marginTop="3%">
                Dashboard
            </Heading>
            <Switch>
                <Route exact path={`${match.path}`} component={DashboardHome} />
                <Route
                    exact
                    path={`${match.path}/:year/:regional`}
                    component={Teams}
                />
                <Route
                    exact
                    path={`${match.path}/:year/:regional/regional-data/`}
                    component={RegionalData}
                />
                <Route
                    exact
                    path={`${match.path}/:year/:regional/:team`}
                    component={TeamData}
                />
            </Switch>
        </div>
    );
};

export default Dashboard;
