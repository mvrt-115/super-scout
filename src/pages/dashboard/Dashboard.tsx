import React, { FC } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import DashboardHome from './DashboardHome';
import RegionalData from './RegionalData';
import TeamData from './TeamData';
import Teams from './Teams';
import './Dashboard.css';
import { Heading } from '@chakra-ui/react';

interface DashboardProps {}

const Dashboard: FC<DashboardProps> = () => {
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
