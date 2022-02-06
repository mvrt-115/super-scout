import { AddIcon } from '@chakra-ui/icons';
import { Heading, IconButton, Spinner, Tooltip } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Graph from '../../components/Graph';
import GraphInput from '../../components/GraphInput';
import { db } from '../../firebase';

interface RouteParams {
    year: string;
    regional: string;
}

const RegionalData: FC<RouteComponentProps<RouteParams>> = ({ match }) => {
    const [sortBy, setSortBy] = useState<string>();
    const [teams, setTeams] = useState<any[]>([]);
    const [graphs, setGraphs] = useState<any[]>([
        {
            x: 'teamNum',
            y: ['autonPoints', 'teleopPoints', 'endgamePoints'],
            type: 'Bar',
        },
    ]);
    const { year, regional } = match.params;
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const regionalDisplay = localStorage.getItem('regionalDisplay' + year);
        if (regionalDisplay) setGraphs(JSON.parse(regionalDisplay));
        else
            setGraphs([
                {
                    x: 'teamNum',
                    y: ['autonPoints', 'teleopPoints', 'endgamePoints'],
                    type: 'Bar',
                },
            ]);
    }, [year]);

    useEffect(() => {
        const fetchData = async () => {
            const regionalKey = year + regional;
            const [regionalRef, oprsRe, rankingsRe] = await Promise.all([
                db
                    .collection('years')
                    .doc(year)
                    .collection('regionals')
                    .doc(regional)
                    .collection('teams')
                    .get(),
                fetch(
                    `https://www.thebluealliance.com/api/v3/event/${regionalKey}/oprs`,
                    {
                        headers: {
                            'X-TBA-Auth-Key':
                                process.env.REACT_APP_TBA_KEY || '',
                        },
                    },
                ),
                fetch(
                    `https://www.thebluealliance.com/api/v3/event/${regionalKey}/rankings`,
                    {
                        headers: {
                            'X-TBA-Auth-Key':
                                process.env.REACT_APP_TBA_KEY || '',
                        },
                    },
                ),
            ]);
            const [oprsJson, rankingsJson] = await Promise.all([
                oprsRe.json(),
                rankingsRe.json(),
            ]);
            let teams: any = [];
            rankingsJson.rankings.forEach(
                (teamInfo: any, index: string | number) => {
                    const teamKey = teamInfo.team_key;
                    teams[index] = {
                        opr: oprsJson.oprs[teamKey],
                        dpr: oprsJson.dprs[teamKey],
                        ccwm: oprsJson.ccwms[teamKey],
                        ranking: teamInfo.rank,
                        teamNum: teamKey.substring(3),
                    };
                },
            );
            regionalRef.docs.forEach((doc) => {
                let index = 0;
                teams.forEach((team: { teamNum: any }, i: number) => {
                    if (team.teamNum === doc.id) {
                        index = i;
                    }
                });
                console.log(doc.data());
                teams[index] = { ...teams[index], ...doc.data() };
            });
            setTeams(teams);
            console.log(teams);
        };
        fetchData().then(() => setLoading(false));
    }, [regional, year]);
    if (!teams || !teams.length) return null;
    if (loading) return <Spinner />;
    return (
        <div style={{ width: '70%', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', padding: '5%'}}>
            <Heading textAlign={'center'} fontSize={'1.5em'} marginBottom="3%">
                {regional.toUpperCase()} {year}
            </Heading>
            <div>
                {graphs.map((graph, index) => (
                    <>
                        <GraphInput
                            keys={Object.keys(teams[0])}
                            graphData={graph}
                            onChange={(graphData) => {
                                let newGraphs = [...graphs];
                                newGraphs[index] = graphData;
                                setGraphs(newGraphs);
                                localStorage.setItem(
                                    'regionalDisplay' + year,
                                    JSON.stringify(newGraphs),
                                );
                                setSortBy(graphData.sortBy);
                            }}
                            onDelete={() => {
                                let newGraphs = [...graphs];
                                newGraphs.splice(index, 1);
                                setGraphs(newGraphs);
                                localStorage.setItem(
                                    'regionalDisplay' + year,
                                    JSON.stringify(newGraphs),
                                );
                            }}
                        />
                        <Graph
                            data={teams}
                            graphInfo={
                                graph || {
                                    x: 'teamNum',
                                    y: [
                                        'autonPoints',
                                        'teleopPoints',
                                        'endgamePoints',
                                    ],
                                    sortBy: 'ccwm',
                                    type: 'Bar',
                                }
                            }
                            sortBy = { sortBy ? sortBy : ''}
                        />
                    </>
                ))}
                <Tooltip label="Add Graph">
                    <IconButton
                        marginTop="5%"
                        aria-label="Add Graph"
                        icon={<AddIcon />}
                        onClick={() =>
                            setGraphs([
                                ...graphs,
                                {
                                    x: 'teamNum',
                                    y: ['none', 'none', 'none'],
                                    type: 'Bar',
                                },
                            ])
                        }
                        colorScheme="green"
                        width="100%"
                    />
                </Tooltip>
            </div>
        </div>
    );
};

export default RegionalData;
