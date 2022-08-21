import { AddIcon } from '@chakra-ui/icons';
import {
    Button,
    Grid,
    Heading,
    HStack,
    IconButton,
    Spinner,
    Stack,
    Text,
    Tooltip,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Graph from '../../components/Graph';
import GraphInput from '../../components/GraphInput';
import { db, functions } from '../../firebase';
import {
    RadarChart,
    Radar,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    PieChart,
    Pie,
    Tooltip as REToolTip,
    Cell,
} from 'recharts';
import Paper from '@mui/material/Paper';
import {
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableBody,
    TableCell,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material';
import { AiOutlineConsoleSql } from 'react-icons/ai';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';

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

const TeamData: FC<RouteComponentProps<RouteParams>> = ({ match}) => {
    const { year, regional, team } = match.params;
    const [matches, setMatches] = useState<any[]>([]);
    const [graphs, setGraphs] = useState<GraphData[]>(
        [
            {
                x: 'matchNum',
                y: ['teamNum', 'none', 'none'],
                sortBy: 'ccwm',
                type: 'Bar',
            },
        ]
    );
    const [oprStat, setOprStat] = useState<RadarChartStat>({
        value: 0,
        percentile: 0,
        max: 0,
    });
    const [dprStat, setDprStat] = useState<RadarChartStat>({
        value: 0,
        percentile: 0,
        max: 0,
    });
    const [ccwmStat, setCcwmStat] = useState<RadarChartStat>({
        value: 0,
        percentile: 0,
        max: 0,
    });
    const [ranking, setRanking] = useState<string>();
    const [loading, setLoading] = useState<boolean>(true);
    const [table, setTable] = useState<boolean>(false);
    const [template, setTemplate] = useState<string[]>(['']);
    const [avgValues, setAvgValues] = useState<any>();
    const [pitScoutData, setPitScoutData] = useState<any>({});
    const [pitScout, setPitScout] = useState<boolean>(false);

    useEffect(() => {
        const teamDisplay = localStorage.getItem('teamDisplay' + year);
        if (teamDisplay) setGraphs(JSON.parse(teamDisplay));
        else
            setPresetGraphs();
    }, [year]);

    useEffect(() => {
        const fetchQuantitativeData = async () => {
            let matches: any[] = [];
            const fetchData = async () => {
                const path = db
                    .collection('years')
                    .doc(year)
                    .collection('regionals')
                    .doc(regional)
                    .collection('teams')
                    .doc(team);
                const avgs = await path.get();                
                setAvgValues(avgs!.data());
                const matchesCollection = await path
                    .collection('matches')
                    .get();
                matches = matchesCollection.docs.map((doc) => doc.data());

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
              
                setLoading(false)
                setMatches(matches);
                
                if (match && matches[0] && matches[1])
                    if (matches.length > 0)
                        setTemplate(
                            Object.keys(matches[0]).length >
                                Object.keys(matches[1]).length
                                ? Object.keys(matches[0])
                                : Object.keys(matches[1])
                        );
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
                if (oprsJson.oprs && oprsJson.dprs && oprsJson.dprs) {
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

                    setOprStat({
                        value: opr,
                        percentile:
                            (oprsList.indexOf(opr) / oprsList.length) * 100,
                        max: oprsList[oprsList.length - 1],
                    });
                    setDprStat({
                        value: dpr,
                        percentile:
                            (dprsList.indexOf(dpr) / dprsList.length) * 100,
                        max: dprsList[dprsList.length - 1],
                    });
                    setCcwmStat({
                        value: ccwm,
                        percentile:
                            (ccwmsList.indexOf(ccwm) / ccwmsList.length) * 100,
                        max: ccwmsList[ccwmsList.length - 1],
                    });
                    const rankingsList = rankingsJson.rankings;
                    let index = 0;
                    for (let i = 0; i < rankingsList.length; i++) {
                        if (rankingsList[i].team_key === `frc${team}`)
                            index = i;
                    }
                    setRanking(`${index + 1}`);
                }
            };        
            fetchData()
        };

        const fetchQualitativeData = async () => {
            await db
                .collection('years')
                .doc(year)
                .collection('regionals')
                .doc(regional)
                .collection('teams')
                .doc(team)
                .collection('pitScoutData')
                .doc('pitScoutAnswers')
                .get()
                .then((data) => {
                    setPitScoutData(data.data() || {});                    
                });
        };

        fetchQuantitativeData()
            .then(fetchQualitativeData)

    }, [year, regional, team]);
    const setPresetGraphs = async () => {
        await db.collection('years')
            .doc(year)
            .collection('regionals')
            .doc(regional)
            .collection("presetGraphs")
            .doc('team')
            .get()
            .then((doc) => {
                const temp: any[] = [];
                doc.data()!["graphs"]?.forEach((preset: any) => {
                    temp.push({
                        x: preset["xAxis"],
                        y: [preset["yAxis1"], preset["yAxis2"], preset["yAxis3"]],
                        type: preset["graphType"],
                        sortBy: preset["sortBy"] ? preset["sortBy"] : preset["yAxis1"]
                    });
                });
                setGraphs(temp);
            });
    }
    const renderClimbData = () => {
        const data: any = [
            { name: 'Low', count: 0, fill: '#260235' },
            { name: 'Mid', count: 0, fill: '#550575' },
            { name: 'High', count: 0, fill: '#dab0ec' },
            { name: 'Traversal', count: 0, fill: '#ffc410' },
            { name: 'None', count: 0, fill: '#202020' },
        ];
        matches.forEach((match) => {
            switch (match['Climb rung']) {
                case 'Low':
                    data[0]['count'] += 1;
                    break;
                case 'Mid':
                    data[1]['count'] += 1;
                    break;
                case 'High':
                    data[2]['count'] += 1;
                    break;
                case 'Traversal':
                    data[3]['count'] += 1;
                    break;
                case 'None':
                    data[4]['count'] += 1;
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
                    paddingAngle={2}
                />
                <REToolTip />
            </PieChart>
        );
    };
    const renderGraphs = () => {
        return (
            <>
                {graphs.map((graph, index) => (
                    <>
                        <GraphInput
                            keys={Object.keys(matches[0]).filter(
                                (key) =>
                                    typeof matches[0][key] === 'number' ||
                                    Number.parseInt(matches[0][key]) ==
                                    matches[0][key],
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
                                        'teleopPoints',
                                        'autonPoints',
                                        'endgamePoints',
                                    ],
                                    type: 'Bar',
                                    sortBy: 'teleopPoints'
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
                        onClick={() => {
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
                        }
                        colorScheme="green"
                        width="100%"
                    />
                </Tooltip>
                {year === '2022' && (
                    <Text
                        style={{
                            fontSize: '40px',
                            textAlign: 'center',
                            marginTop: '5vh',
                            fontWeight: 'bolder',
                        }}
                    >
                        Climb data:
                    </Text>
                )}
                {year === '2022' && renderClimbData()}
            </>
        );
    };
    
    const renderTable = () => {
        return (
            <ThemeProvider theme={createTheme()}>
                <DataTable pTemplate={template} pList={matches} base="matchNum"/>
            </ThemeProvider>
        );
    };
    if (loading) return <Spinner />;

    const renderScoutingData = () => {
        if (!matches || !matches.length)
            return (
                <Text
                    style={{
                        marginTop: '1rem',
                    }}
                >
                    No scouting data available!
                </Text>
            );
        return (
            <div
                style={{
                    width: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '5%',
                }}
            >
                <Heading
                    textAlign={'center'}
                    fontSize={'1.5em'}
                    fontWeight={'bolder'}
                >
                    Team # {team} Rank # {ranking}
                </Heading>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '2vh',
                        marginBottom: '2vh',
                        width: '100%',
                    }}
                >
                    <Stack alignItems={'center'}>
                        <HStack>
                            <Card
                                title="OPR"
                                info={Math.round(oprStat.value * 100) / 10 + ''}
                                subinfo={oprStat.percentile + '% Percentile'}
                            ></Card>
                            <Card
                                title="DPR"
                                info={Math.round(dprStat.value * 100) / 10 + ''}
                                subinfo={dprStat.percentile + '% Percentile'}
                            ></Card>
                            <Card
                                title="CCWM"
                                info={
                                    Math.round(ccwmStat.value * 100) / 100 + ''
                                }
                                subinfo={ccwmStat.percentile + '% Percentile'}
                            ></Card>
                        </HStack>

                        <Grid
                            // gap={1}
                            templateColumns={
                                'repeat(auto-fit, minmax(150px, 1fr))'
                            }
                            width={'65vw'}
                        >
                            {Object.entries(avgValues).map(([key, value]) => {
                                if (
                                    key.indexOf('match') == -1 &&
                                    key !== 'teamNum'
                                )
                                    return (
                                        <Card
                                            title={'Average ' + key}
                                            info={
                                                parseFloat(value + '').toFixed(
                                                    3,
                                                ) + ''
                                            }
                                        ></Card>
                                    );
                            })}
                        </Grid>
                    </Stack>
                </div>
                <TeamRadarChartWrapper
                    team={team}
                    opr={oprStat}
                    dpr={dprStat}
                    ccwm={ccwmStat}
                />
                <Button
                    variant="outline"
                    aria-label="Table"
                    onClick={() => {
                        setTable(!table);
                    }}
                    width={'100%'}
                    marginTop={4}
                    marginBottom={4}
                    colorScheme={'mv-purple'}
                >
                    View {table ? 'Graphs' : 'Table'}
                </Button>
                {table ? renderTable() : renderGraphs()}
            </div>
        );
    };

    const renderPitScoutData = () => {
        if (Object.keys(pitScoutData).length === 0) {
            return (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{ fontWeight: 'bolder' }}>
                        No pit scouting data available.
                    </Text>
                </div>
            );
        }
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                }}
            >
                {Object.keys(pitScoutData).map((field: any) => {
                    return (
                        <Text
                            style={{
                                marginTop: '1rem',
                            }}
                        >
                            {`${field}: ${pitScoutData[field]}`}
                        </Text>
                    );
                })}
            </div>
        );
    };


    return (
        <>
            <div>
                <Button
                    onClick={() => {
                        setPitScout(!pitScout);
                    }}
                >
                    {pitScout ? 'View Scouting Data' : 'View Pit Scouting data'}
                </Button>
            </div>
            {pitScout ? renderPitScoutData() : renderScoutingData()}
        </>
    );
};

interface RadarDataStruct {
    stat: string;
    value: number;
    max: number;
}
//create radar chart for team with props opr dpr ccwm
const TeamRadarChartWrapper: React.FC<{
    team: string;
    opr: RadarChartStat;
    dpr: RadarChartStat;
    ccwm: RadarChartStat;
}> = ({ team, opr, dpr, ccwm }) => {
    const radarData: RadarDataStruct[] = [
        { stat: 'OPR', value: parseFloat(opr.value.toFixed(3)), max: opr.max },
        { stat: 'DPR', value: parseFloat(dpr.value.toFixed(3)), max: dpr.max },
        { stat: 'CCWM', value: parseFloat(ccwm.value.toFixed(3)), max: ccwm.max },
    ];
    const getToolTip = (stat: string) => {
        return {
            name: stat,
            value: `${stat}: ${radarData.find((data) => data.stat === stat)?.value
                }`,
        };
    };

    return (
        <RadarChart width={400} height={300} data={radarData} cx="50%" cy="50%">
            <PolarGrid />
            <PolarAngleAxis dataKey="stat" />
            <PolarRadiusAxis
                angle={30}
                domain={[0, Math.ceil(Math.max(opr.max, dpr.max, ccwm.max))]}
            />
            <Radar
                name={team}
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
            />
            <REToolTip />
        </RadarChart>
    );
};

export default TeamData;