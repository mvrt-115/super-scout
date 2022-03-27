import { AddIcon } from '@chakra-ui/icons';
import { Heading, IconButton, Spinner, Text, Tooltip } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Graph from '../../components/Graph';
import GraphInput from '../../components/GraphInput';
import { db, functions } from '../../firebase';
import { RadarChart, Radar, PolarAngleAxis, PolarGrid, PolarRadiusAxis, PieChart, Pie, Tooltip as REToolTip, Cell } from 'recharts';

interface RouteParams {
    year: string;
    regional: string;
    team: string;
}

interface RadarChartStat {
    value: number;
    percentile: number;
    max: number;
}

const TeamData: FC<RouteComponentProps<RouteParams>> = ({ match }) => {
    const { year, regional, team } = match.params;
    const [matches, setMatches] = useState<any[]>([]);
    const [graphs, setGraphs] = useState<GraphData[]>([]);
    const [oprInfo, setOprInfo] = useState<string>();
    const [dprInfo, setDprInfo] = useState<string>();
    const [ccwmInfo, setCcwmInfo] = useState<string>();
    const [oprStat, setOprStat] = useState<RadarChartStat>({ value: 0, percentile: 0, max: 0 });
    const [dprStat, setDprStat] = useState<RadarChartStat>({ value: 0, percentile: 0, max: 0 });
    const [ccwmStat, setCcwmStat] = useState<RadarChartStat>({ value: 0, percentile: 0, max: 0 });
    const [ranking, setRanking] = useState<string>();
    const [loading, setLoading] = useState<boolean>(true);
    const [sortBy, setSortBy] = useState<string>('ccwm');
    const [opr, setOpr] = useState<number>(0);
    const [dpr, setDpr] = useState<number>(0);
    const [ccwm, setCcwm] = useState<number>(0);

    useEffect(() => {
        const teamDisplay = localStorage.getItem('teamDisplay' + year);
        if (teamDisplay) setGraphs(JSON.parse(teamDisplay));
        else
            setGraphs([
                {
                    x: 'matchNum',
                    y: ['teamNum', 'none', 'none'],
                    sortBy: 'ccwm',
                    type: 'Bar',
                },
            ]);
    }, [year]);

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
            setOpr(opr);
            setDpr(dpr);
            setCcwm(ccwm);

            oprsList.sort((a, b) => a - b);
            dprsList.sort((a, b) => a - b);
            ccwmsList.sort((a, b) => a - b);

            setOprStat({
                value: opr,
                percentile: oprsList.indexOf(opr) / oprsList.length * 100,
                max: oprsList[oprsList.length - 1],
            })
            setDprStat({
                value: dpr,
                percentile: dprsList.indexOf(dpr) / dprsList.length * 100,
                max: dprsList[dprsList.length - 1],
            })
            setCcwmStat({
                value: ccwm,
                percentile: ccwmsList.indexOf(ccwm) / ccwmsList.length * 100,
                max: ccwmsList[ccwmsList.length - 1],
            })

            setOprInfo(
                `OPR (Offensive Power Rating): ${Math.round(opr * 100) / 100
                }, which is in the ${Math.round(
                    (oprsList.indexOf(opr) / oprsList.length) * 100,
                )}th percentile`,
            );
            setDprInfo(
                `DPR (Defensive Power Rating): ${Math.round(dpr * 100) / 100
                }, which is in the ${Math.round(
                    (dprsList.indexOf(dpr) / dprsList.length) * 100,
                )}th percentile`,
            );
            setCcwmInfo(
                `CCWM (Calculated Contribution to Winning Margin): ${Math.round(ccwm * 100) / 100
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
        const fetchMatchData = async () => {
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
            .then(() => setLoading(false))
            .then(fetchMatchData);
    }, [year, regional, team]);

    const getAverageAutonPoints = () => {
        let avgPoints: number = 0;
        matches.forEach((match) => {
            let curr = (4 * match['Auton Upper'])
                + (2 * match['Auton Bottom']);
            if (match['Left Tarmac'] === undefined) curr += (2 * +match['Leave Tarmac']);
            else curr += (2 * +match['Left Tarmac']);
            avgPoints += curr;
        });
        avgPoints /= matches.length;
        return Math.round(avgPoints * 100) / 100;
    }

    const getAverageTeleopPoints = () => {
        let avgPoints: number = 0;
        matches.forEach((match) => {
            avgPoints += match['Teleop Bottom'] + (2 * match['Teleop Upper']);
        });
        avgPoints /= matches.length;
        return Math.round(avgPoints * 100) / 100;
    }

    const renderClimbData = () => {
        const data: any = [
            { name: "Low", count: 0 },
            { name: "Mid", count: 0 },
            { name: "High", count: 0 },
            { name: "Traversal", count: 0 },
        ];
        const colors: string[] = ['#9969ac', '#773791', '#4b0f6d', '#ffc410',]
        matches.forEach((match) => {
            switch (match['Climb rung']) {
                case "Low":
                    data[0]['count'] += 1;
                    break;
                case "Mid":
                    data[1]['count'] += 1;
                    break;
                case "High":
                    data[2]['count'] += 1;
                    break;
                case "Traversal":
                    data[3]['count'] += 1;
                    break;
            }
        });
        return (
            <PieChart width={400} height={400}>
                <Pie
                    dataKey={'count'}
                    isAnimationActive={false}
                    data={data}
                    cx={200}
                    cy={200}
                    innerRadius={100}
                    outerRadius={150}
                    label
                    fill='#550575'
                    paddingAngle={2}
                />
                <REToolTip />
            </PieChart>
        );
    }

    if (!matches || !matches.length) return null;
    if (loading) return <Spinner />;
    return (
        <div style={{ width: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5%' }}>
            <Heading textAlign={'center'} fontSize={'1.5em'} fontWeight={'bolder'}>
                Team # {team} Rank # {ranking}
            </Heading>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2vh',
                    marginBottom: '2vh'
                }}
            >
                <Text
                    textAlign={'center'}
                    fontWeight={'bold'}
                >
                    {`OPR: ${Math.round(opr * 100) / 100}`}
                </Text>
                <Text textAlign={'center'} fontWeight={'bold'}>{`DPR: ${Math.round(dpr * 100) / 100}`}</Text>
                <Text textAlign={'center'} fontWeight={'bold'}>{`CCWM: ${Math.round(ccwm * 100) / 100}`}</Text>
                <Text textAlign={'center'} fontWeight={'bold'}>{`Average amount of points scored in auton: ${getAverageAutonPoints()}`}</Text>
                <Text textAlign={'center'} fontWeight={'bold'}>{`Average amount of points scored in teleop: ${getAverageTeleopPoints()}`}</Text>
            </div>
            <TeamRadarChartWrapper team={team} opr={oprStat} dpr={dprStat} ccwm={ccwmStat} />
            <div>
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
                                    'teamDisplay' + year,
                                    JSON.stringify(newGraphs),
                                );
                                setSortBy(graphData.sortBy);
                            }}
                            onDelete={() => {
                                let newGraphs = [...graphs];
                                newGraphs.splice(index, 1);
                                setGraphs(newGraphs);
                                localStorage.setItem(
                                    'teamDisplay' + year,
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
                            sortBy={sortBy}
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
                                    sortBy: 'ccwm',
                                    type: 'Bar',
                                },
                            ])
                        }
                        colorScheme="green"
                        width="100%"
                    />
                </Tooltip>
                <Text
                    style={{
                        fontSize: '40px',
                        textAlign: 'center',
                        marginTop: '5vh',
                        fontWeight: 'bolder'
                    }}
                >
                    Climb data:
                </Text>
                {renderClimbData()}
            </div>
        </div>
    );
};

interface RadarDataStruct {
    stat: string,
    value: number,
    max: number,
}
//create radar chart for team with props opr dpr ccwm
const TeamRadarChartWrapper: React.FC<{ team: string, opr: RadarChartStat; dpr: RadarChartStat; ccwm: RadarChartStat }> = ({ team, opr, dpr, ccwm }) => {
    const radarData: RadarDataStruct[] = [{ stat: 'OPR', value: opr.value, max: opr.max },
    { stat: 'DPR', value: dpr.value, max: dpr.max },
    { stat: 'CCWM', value: ccwm.value, max: ccwm.max }];
    const getToolTip = (stat: string) => {
        return {
            name: stat,
            value: `${stat}: ${radarData.find((data) => data.stat === stat)?.value}`
        };
    }

    return (
        <RadarChart width={400} height={300} data={radarData} cx="50%" cy="50%">
            <PolarGrid />
            <PolarAngleAxis dataKey="stat" />
            <PolarRadiusAxis angle={30} domain={[0, Math.ceil(Math.max(opr.max, dpr.max, ccwm.max))]} />
            <Radar name={team} dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <REToolTip />
        </RadarChart>
    );
}

export default TeamData;