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
    const [oprInfo, setOprInfo] = useState<any>();
    const [dprInfo, setDprInfo] = useState<any>();
    const [ccwmInfo, setCcwmInfo] = useState<any>();
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
    const [sortBy, setSortBy] = useState<string>('ccwm');
    const [table, setTable] = useState<boolean>(false);
    const [template, setTemplate] = useState<string[]>(['']);
    const [avgValues, setAvgValues] = useState<any>();
    const [pitScoutData, setPitScoutData] = useState<any>({});
    const [pitScout, setPitScout] = useState<boolean>(false);

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
        const fetchQuantitativeData = async () => {
            console.log('inside');
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
                setMatches(matches);
                if (match && matches[0] && matches[1])
                    if (matches.length > 0)
                        setTemplate(
                            Object.keys(matches[0]).length >
                                Object.keys(matches[1]).length
                                ? matches[0]
                                : matches[1],
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

                    setOprInfo('{');
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
                        if (rankingsList[i].team_key === `frc${team}`)
                            index = i;
                    }
                    setRanking(`${index + 1}`);
                }
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
            fetchData().then(fetchMatchData);
            console.log('done');
        };

        const fetchQualitativeData = async () => {
            console.log('inside the other one');
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
                    console.log('inside the promise');
                    setPitScoutData(data.data() || {});
                });
            console.log('done with quantitative');
        };

        fetchQuantitativeData()
            .then(fetchQualitativeData)
            .then(() => {
                console.log('done loading');
                setLoading(false);
            });
    }, [year, regional, team]);

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
        console.log('rendering grpahs');
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
                {console.log('done rendering graphs')}
            </>
        );
    };
    const sort = (ascending: boolean, key: string) => {
        let temp = [...matches];
        temp.sort((a, b) => {
            if (a === undefined) {
                return 1;
            }
            if (b === undefined) {
                return -1;
            }
            return ascending ? a[key] - b[key] : b[key] - a[key];
        });
        setMatches(temp);
    };

    const renderTable = () => {
        return (
            <ThemeProvider theme={createTheme()}>
                <TableContainer
                    component={Paper}
                    style={{ minWidth: '90vw', maxHeight: '90vw' }}
                >
                    <Table stickyHeader sx={{ minWidth: 950, width: '90vw' }}>
                        <TableHead>
                            <TableRow style={{ whiteSpace: 'nowrap' }}>
                                <TableCell key="matchNum">
                                    Match Number
                                    <Button
                                        onClick={() => {
                                            sort(false, 'matchNum');
                                        }}
                                    >
                                        ↑
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            sort(true, 'matchNum');
                                        }}
                                    >
                                        ↓
                                    </Button>
                                </TableCell>
                                {Object.keys(template).map((key: any) => {
                                    if (
                                        key != 'matchNum' &&
                                        key != 'teamNum' &&
                                        typeof template[key] == 'number'
                                    )
                                        return (
                                            <TableCell key={key}>
                                                {key}
                                                <Button
                                                    onClick={() => {
                                                        sort(false, key);
                                                    }}
                                                >
                                                    ↑
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        sort(true, key);
                                                    }}
                                                >
                                                    ↓
                                                </Button>
                                            </TableCell>
                                        );
                                })}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {matches.map((match) => (
                                <TableRow
                                    key={match['matchNum']}
                                    sx={{
                                        '&:last-child td, &:last-child th': {
                                            border: 0,
                                        },
                                    }}
                                >
                                    <TableCell
                                        key={match['matchNum'] + 'teamNum'}
                                    >
                                        {match['matchNum']}
                                    </TableCell>
                                    {Object.keys(template).map((field: any) => {
                                        if (
                                            field != 'matchNum' &&
                                            field != 'teamNum' &&
                                            typeof match[field] == 'number'
                                        )
                                            return match[field] !==
                                                undefined ? (
                                                <TableCell
                                                    key={
                                                        match['matchNum'] +
                                                        field
                                                    }
                                                >
                                                    {typeof match[field] !==
                                                    'number'
                                                        ? match[field]
                                                        : JSON.stringify(
                                                              match[field],
                                                          ).indexOf('.') == -1
                                                        ? match[field]
                                                        : parseFloat(
                                                              match[field],
                                                          ).toFixed(3)}
                                                </TableCell>
                                            ) : (
                                                <TableCell></TableCell>
                                            );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
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
                                            title={'Average' + key}
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
        console.log('Called');
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
                {Object.keys(pitScoutData).map((field: any, index: number) => {
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
        { stat: 'OPR', value: opr.value, max: opr.max },
        { stat: 'DPR', value: dpr.value, max: dpr.max },
        { stat: 'CCWM', value: ccwm.value, max: ccwm.max },
    ];
    const getToolTip = (stat: string) => {
        return {
            name: stat,
            value: `${stat}: ${
                radarData.find((data) => data.stat === stat)?.value
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
