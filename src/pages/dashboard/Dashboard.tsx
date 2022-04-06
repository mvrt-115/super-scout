import React, { FC, useEffect } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import DashboardHome from './DashboardHome';
import RegionalData from './RegionalData';
import TeamData from './TeamData';
import Teams from './Teams';
import './Dashboard.css';
import { Heading, useEventListener } from '@chakra-ui/react';
import { db } from '../../firebase';

interface DashboardProps { }

const Dashboard: FC<DashboardProps> = () => {

    useEffect(() => {
        (async () => {
            await correctData();
        })();
    }, [])

    const correctData = async () => {

        let teamTemplate = await db.collection('years').doc('2022').collection('regionals').doc('cafr').collection('teams');
        let obj = await (await teamTemplate.doc('2486').collection('pitScoutData').doc('pitScoutAnswers').get()).data() || {};
        teamTemplate.doc('2485').collection('pitScoutData').doc('pitScoutAnswers').set(obj);
        (await teamTemplate.get()).docs.forEach(async (doc) => {
            let avgAutonPoints = 0, avgTeleopPoints = 0;
            const data = await doc.data();
            let endgamePoints = data['endgamePoints'];
            if (endgamePoints === 0 || isNaN(endgamePoints)) {
                let climbScore: number = 0;
                const matches = await teamTemplate.doc(doc.id).collection('matches').get();
                const matchCount = (matches).docs.length;
                (matches).docs.forEach((match) => {
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
            data['endgamePoints'] = endgamePoints;
            teamTemplate.doc(doc.id).set(data);
        })
    }

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
