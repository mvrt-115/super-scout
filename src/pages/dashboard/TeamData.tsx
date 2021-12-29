import { AddIcon } from '@chakra-ui/icons';
import { Heading, IconButton, Spinner, Text, Tooltip } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Graph from '../../components/Graph';
import GraphInput from '../../components/GraphInput';
import { db, functions } from '../../firebase';

interface RouteParams {
    year: string;
    regional: string;
    team: string;
}

const TeamData: FC<RouteComponentProps<RouteParams>> = ({ match }) => {
    const { year, regional, team } = match.params;
    const [matches, setMatches] = useState<any[]>([]);
    const [graphs, setGraphs] = useState<GraphData[]>([]);
    const [oprInfo, setOprInfo] = useState<string>();
    const [dprInfo, setDprInfo] = useState<string>();
    const [ccwmInfo, setCcwmInfo] = useState<string>();
    const [ranking, setRanking] = useState<string>();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const teamDisplay = localStorage.getItem('teamDisplay');
        if (teamDisplay) setGraphs(JSON.parse(teamDisplay));
        else
            setGraphs([
                {
                    x: 'matchNum',
                    y: ['teamNum', 'none', 'none'],
                    type: 'Bar',
                },
            ]);
    }, []);

    useEffect(() => {
        let matches: any[] = [];
        const fetchData = async () => {
            const matchesCollection = await db
                .collection('years')
                .doc(year)
                .collection('regionals')
                .doc(regional)
                .collection('teams')
                .doc(team)
                .collection('matches')
                .get();
            matches = matchesCollection.docs.map((doc) => doc.data());
            setMatches(matches);
            const regionalKey = year + regional;

            const [rankingsRes, oprsRes] = await Promise.all([
                fetch(
                    `https://www.thebluealliance.com/api/v3/event/${regionalKey}/rankings`,
                    {
                        headers: {
                            'X-TBA-Auth-Key':
                                process.env.REACT_APP_TBA_KEY || '',
                        },
                    },
                ),
                fetch(
                    `https://www.thebluealliance.com/api/v3/event/${regionalKey}/oprs`,
                    {
                        headers: {
                            'X-TBA-Auth-Key':
                                process.env.REACT_APP_TBA_KEY || '',
                        },
                    },
                ),
            ]);
            const [oprsJson, rankingsJson] = await Promise.all([
                oprsRes.json(),
                rankingsRes.json(),
            ]);

            const oprsList = Object.keys(oprsJson.oprs).map(
                (key) => oprsJson.oprs[key],
            );
            const dprsList = Object.keys(oprsJson.dprs).map(
                (key) => oprsJson.dprs[key],
            );
            const ccwmsList = Object.keys(oprsJson.ccwms).map(
                (key) => oprsJson.ccwms[key],
            );

            const opr = oprsJson.oprs[`frc${team}`];
            const dpr = oprsJson.dprs[`frc${team}`];
            const ccwm = oprsJson.ccwms[`frc${team}`];

            oprsList.sort((a, b) => a - b);
            dprsList.sort((a, b) => a - b);
            ccwmsList.sort((a, b) => a - b);

            setOprInfo(
                `OPR (Offensive Power Rating): ${
                    Math.round(opr * 100) / 100
                }, which is in the ${Math.round(
                    (oprsList.indexOf(opr) / oprsList.length) * 100,
                )}th percentile`,
            );
            setDprInfo(
                `DPR (Defensive Power Rating): ${
                    Math.round(dpr * 100) / 100
                }, which is in the ${Math.round(
                    (dprsList.indexOf(dpr) / dprsList.length) * 100,
                )}th percentile`,
            );
            setCcwmInfo(
                `CCWM (Calculated Contribution to Winning Margin): ${
                    Math.round(ccwm * 100) / 100
                }, which is in the ${Math.round(
                    (ccwmsList.indexOf(ccwm) / ccwmsList.length) * 100,
                )}th percentile`,
            );
            const rankingsList = rankingsJson.rankings;
            let index = 0;
            for (let i = 0; i < rankingsList.length; i++) {
                if (rankingsList[i].team_key === `frc${team}`) index = i;
            }
            setRanking(`${index + 1}`);
        };
        const fetchStupidData = async () => {
            matches = await Promise.all(
                matches.map(async (match) => {
                    const fetchData =
                        functions.httpsCallable('calculatePoints');
                    const pointsData = await fetchData({
                        year,
                        regional,
                        team,
                        match: match.matchNum + '',
                    });
                    return {
                        ...match,
                        ...pointsData.data,
                    };
                }),
            );
            setMatches(matches);
        };
        fetchData()
            .then(fetchStupidData)
            .then(() => setLoading(false));
    }, [year, regional, team]);

    if (!matches || !matches.length) return null;
    if (loading) return <Spinner />;
    return (
        <div style={{ width: '60%', alignItems: 'start' }}>
            <Heading textAlign={'center'} fontSize={'1.5em'}>
                Team # {team} Rank # {ranking}
            </Heading>
            <Text>{oprInfo}</Text>
            <Text>{dprInfo}</Text>
            <Text marginBottom={'3%'}>{ccwmInfo}</Text>
            <div style={{ width: '90%', justifyContent: 'center' }}>
                {graphs.map((graph, index) => (
                    <>
                        <GraphInput
                            keys={Object.keys(matches[0]).filter(
                                (key) => typeof matches[0][key] === 'number',
                            )}
                            graphData={graph}
                            onChange={(graphData) => {
                                let newGraphs = [...graphs];
                                newGraphs[index] = graphData;
                                setGraphs(newGraphs);
                                localStorage.setItem(
                                    'teamDisplay',
                                    JSON.stringify(newGraphs),
                                );
                                console.log(newGraphs);
                            }}
                            onDelete={() => {
                                let newGraphs = [...graphs];
                                newGraphs.splice(index, 1);
                                setGraphs(newGraphs);
                                localStorage.setItem(
                                    'teamDisplay',
                                    JSON.stringify(newGraphs),
                                );
                            }}
                        />
                        <Graph
                            data={matches}
                            graphInfo={
                                graph || {
                                    x: 'matchNum',
                                    y: [
                                        'autonPoints',
                                        'teleopPoints',
                                        'endgamePoints',
                                    ],
                                    type: 'Bar',
                                }
                            }
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
                                    x: 'matchNum',
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

export default TeamData;
