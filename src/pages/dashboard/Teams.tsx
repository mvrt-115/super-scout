import { Button, Grid } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { db } from '../../firebase';

interface RouteParams {
    year: string;
    regional: string;
}

const Teams: FC<RouteComponentProps<RouteParams>> = ({ match }) => {
    const [teams, setTeams] = useState<string[]>([]);
    const year = match.params.year;
    const regional = match.params.regional;

    useEffect(() => {
        const fetchData = async () => {
            const teamsCollection = await db
                .collection('years')
                .doc(year)
                .collection('regionals')
                .doc(regional)
                .collection('teams')
                .get();
            const teams: string[] = teamsCollection.docs.map((doc) => doc.id);
            setTeams(teams);
        };
        fetchData();
    }, [year, regional]);

    return (
        <>
            <Button
                as={Link}
                to={`/dashboard/${year}/${regional}/regional-data/`}
                colorScheme="mv-purple"
                size="lg"
                width={'100%'}
            >
                View Regional Data
            </Button>
            <Grid
                gap={1}
                templateColumns={'repeat(auto-fit, minmax(200px, 1fr))'}
                width={'100%'}
            >
                {teams.map((team) => (
                    <li className="link" key={team}>
                        <Link
                            to={`/dashboard/${year}/${regional}/${team}`}
                            style={{ textAlign: 'center' }}
                        >
                            {team}
                        </Link>
                    </li>
                ))}
            </Grid>
        </>
    );
};

export default Teams;
