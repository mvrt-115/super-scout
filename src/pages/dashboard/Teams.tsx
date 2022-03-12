import { Button, Grid, Heading } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { db } from '../../firebase';
import { ReactComponent as Empty } from '../../assets/Empty.svg';

interface RouteParams {
    year: string;
    regional: string;
}

const Teams: FC<RouteComponentProps<RouteParams>> = ({ match }) => {
    const [teams, setTeams] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<number>(Date.now());
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
        fetch(`https://www.thebluealliance.com/api/v3/events/${year}/simple`, {
            headers: {
                'X-TBA-Auth-Key': process.env.REACT_APP_TBA_KEY || '',
            },
        })
            .then((res) => res.json())
            .then((data) => console.log(data));

        fetch(
            `https://www.thebluealliance.com/api/v3/event/${year}${regional}/simple`,
            {
                headers: {
                    'X-TBA-Auth-Key': process.env.REACT_APP_TBA_KEY || '',
                },
            },
        )
            .then((res) => res.json())
            .then((data) => {
                if (Date.parse(data['start_date']) <= Date.now()) fetchData();
                setStartDate(Date.parse(data['start_date']));
            });
    }, [year, regional]);
    if (Date.now() < startDate)
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                }}
            >
                <Empty width={'90%'} height={'90%'} />
                <Heading
                    as="h3"
                    size="md"
                    textAlign={'center'}
                    marginTop={'2%'}
                >
                    The {regional.toUpperCase} has not started yet, please check
                    back after {new Date(startDate).toLocaleDateString()}
                </Heading>
            </div>
        );

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
