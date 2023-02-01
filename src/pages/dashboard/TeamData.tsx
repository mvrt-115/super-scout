//year is manually set to '2023'

import { AddIcon } from '@chakra-ui/icons';
import {
    Box,
    Button,
    Center,
    Grid,
    GridItem,
    Heading,
    HStack,
    IconButton,
    Spinner,
    Stack,
    Text,
    Tooltip,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
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
import { getTsBuildInfoEmitOutputFilePath } from 'typescript';

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

//const calcPoints = require("../../../functions/src/index");

const calcAutonPoints = (matchData: any, year: number | string) => {
    if (year == '2019') {
        return matchData.autonBottom * 2 +
            matchData.autonUpper * 4 +
            matchData.autonInner * 6 +
            matchData.crossedInitLine
            ? 5
            : 0;
    } else if (year == '2022') {
        let autonPoints: number = 0;
        autonPoints +=
            2 * matchData['Auton Bottom'] + 4 * matchData['Auton Upper'];
        if (matchData['Left Tarmac'] === undefined)
            autonPoints += 2 * +matchData['Leave Tarmac'];
        else autonPoints += 2 * +matchData['Left Tarmac'];
        return autonPoints;
    }
    return -1;
};

const calcTeleopPoints = (matchData: any, year: number | string) => {
    if (year == '2019') {
        return (
            matchData.teleopBottom +
            matchData.teleopUpper * 2 +
            matchData.teleopInner * 4
        );
    } else if (year == '2022') {
        return matchData['Teleop Bottom'] + matchData['Teleop Upper'] * 2;
    }
    return -1;
};

const calcEndgamePoints = (matchData: any, year: number | string) => {
    if (year == '2019') {
        let endgamePoints = 5;
        if (!matchData.hangFail) endgamePoints += 20;
        if (!matchData.levelFail) endgamePoints += 15;
        return endgamePoints;
    } else if (year == '2022') {
        let climbScore: number = 0;
        switch (matchData['Climb rung']) {
            case 'Low':
                climbScore = 4;
                break;
            case 'Mid':
                climbScore = 6;
                break;
            case 'High':
                climbScore = 10;
                break;
            case 'Traversal':
                climbScore = 15;
                break;
            default:
                climbScore = 0;
        }
        return climbScore;
    }
    return -1;
};

const TeamData: FC<RouteComponentProps<RouteParams>> = ({ match }) => {
    const { regional, team } = match.params;
    var k = '2023';
    const year = k;
    const [matches, setMatches] = useState<any[]>([]);
    const [graphs, setGraphs] = useState<GraphData[]>([
        {
            x: 'matchNum',
            y: ['teamNum', 'none', 'none'],
            sortBy: 'ccwm',
            type: 'Bar',
        },
    ]);
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
        else setPresetGraphs();
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
                        let matchRef = await db
                            .collection('years')
                            .doc(year)
                            .collection('regionals')
                            .doc(regional)
                            .collection('teams')
                            .doc(team)
                            .collection('matches')
                            .doc(match.matchNum + '')
                            .get();
                        let matchData = matchRef.data();
                        let autonPoints = calcAutonPoints(matchData, year);
                        let teleopPoints = calcTeleopPoints(matchData, year);
                        let endgamePoints = calcEndgamePoints(matchData, year);
                        return {
                            ...match,
                            autonPoints,
                            teleopPoints,
                            endgamePoints,
                        };
                    }),
                );

                setLoading(false);
                setMatches(matches);

                if (match && matches[0] && matches[1])
                    if (matches.length > 0)
                        setTemplate(
                            Object.keys(matches[0]).length >
                                Object.keys(matches[1]).length
                                ? Object.keys(matches[0])
                                : Object.keys(matches[1]),
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
                    console.log(avgValues);
                }
            };
            fetchData();
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

        fetchQuantitativeData().then(fetchQualitativeData);
    }, [year, regional, team]);
    const setPresetGraphs = async () => {
        await db
            .collection('years')
            .doc(year)
            .collection('regionals')
            .doc(regional)
            .collection('presetGraphs')
            .doc('team')
            .get()
            .then((doc) => {
                const temp: any[] = [];
                if (doc.data()) {
                    doc.data()!['graphs']?.forEach((preset: any) => {
                        temp.push({
                            x: preset['xAxis'],
                            y: [
                                preset['yAxis1'],
                                preset['yAxis2'],
                                preset['yAxis3'],
                            ],
                            type: preset['graphType'],
                            sortBy: preset['sortBy']
                                ? preset['sortBy']
                                : preset['yAxis1'],
                        });
                    });
                }
                setGraphs(temp);
            });
    };
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
                    outerRadius={150    }
                    label
                    paddingAngle={2}
                />
                <REToolTip />
            </PieChart>
        );
    };
    const renderHeatMap = () => {
        interface HeatmapData {
            name: string; count: number; fill: any; textfill:string;
        }
        //color scheme
        const colors : any = ["#edf8e9", "#c7e9c0", "#a1d99b", "#74c476", "#31a354", "#006d2c"]
        const textcolors : any = ["#0010d9", "#1d3bef", "#3956df", "#5b6da6", "#b0c4d8", "#dfdfff"];
        //Collect/preprocess data
            const data: any = [
                { name: 'Upper Cone', count: 1, fill: '', textfill: '' },
                { name: 'Upper Cube', count: 2, fill: '', textfill: '' },
                { name: 'Mid Cone', count: 3, fill: '', textfill: '' },
                { name: 'Mid Cube', count: 4, fill: '', textfill: '' },
                { name: 'Lower', count: 5, fill: '', textfill: '' },
            ];
            matches.forEach((match) => {
                data[0]['count'] += match["Teleop Upper Cone"] + match["Auton Upper Cone"];
                data[1]['count'] += match["Teleop Upper Cube"] + match["Auton Upper Cube"];
                data[2]['count'] += match["Teleop Mid Cone"] + match["Auton Mid Cone"];
                data[3]['count'] += match["Teleop Mid Cube"] + match["Auton Mid Cube"];
                data[4]['count'] += match["Teleop Lower Shot"] + match["Auton Lower Shot"];
            });
            var max_count=  0;
            for(var i=0; i<5; i++){
                max_count = Math.max(max_count, data[i]['count']);
            }
            console.log(max_count);
            //determine fill/colors based on count
            data.forEach(
                (option: HeatmapData) => {
                    if(option.count<(1/6)*max_count){
                        option.fill=colors[0];
                        option.textfill = textcolors[0];
                    }
                    else if(option.count<(2/6)*max_count){
                        option.fill=colors[1];
                        option.textfill = textcolors[1];
                    }
                    else if(option.count<(3/6)*max_count){
                        option.fill=colors[2];
                        option.textfill = textcolors[2];
                    }
                    else if(option.count<(4/6)*max_count){
                        option.fill=colors[3];
                        option.textfill = textcolors[3];
                    }
                    else if(option.count<(5/6)*max_count){
                        option.fill=colors[4];
                        option.textfill = textcolors[4];
                    }
                    else{
                        option.fill=colors[5];
                        option.textfill = textcolors[5];
                    }
                }); 
            const rendbox = (element: HeatmapData) => {
                return (
                <Box borderRadius = 'md' alignItems='center' w='100px' h='100px' bg={element["fill"]} color = {element['textfill']}>
                    <Center w='100px' h='100px'>
                        <Tooltip label = {element.count.toString()}>
                            {element.name}
                        </Tooltip>
                    </Center>
                </Box>
                )};
                //return heatmap
            return(
                <Stack spacing={10} direction='row' align='center'>
                    <>
                    {rendbox(data[0])}
                    {rendbox(data[1])}
                    {rendbox(data[2])}
                    {rendbox(data[3])}
                    {rendbox(data[4])}
                    </>
            </Stack>
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
                                    sortBy: 'teleopPoints',
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
                            ]);
                        }}
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

                {year === '2023' && (
                    <Text
                        style={{
                            fontSize: '40px',
                            textAlign: 'center',
                            marginTop: '5vh',
                            fontWeight: 'bolder',
                        }}
                    >
                        Scoring Heatmap:
                    </Text>
                )}
                {year === '2023' && renderHeatMap()}
            </>
        );
    };

    const renderTable = () => {
        return (
            <ThemeProvider theme={createTheme()}>
                <DataTable
                    pTemplate={template}
                    pList={matches}
                    base="matchNum"
                />
            </ThemeProvider>
        );
    };
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
                                info={Math.round(oprStat.value * 10) / 10 + ''}
                                subinfo={
                                    Math.round(oprStat.percentile * 10) / 10 +
                                    '% Percentile'
                                }
                            ></Card>
                            <Card
                                title="DPR"
                                info={Math.round(dprStat.value * 100) / 10 + ''}
                                subinfo={
                                    Math.round(dprStat.percentile * 10) / 10 +
                                    '% Percentile'
                                }
                            ></Card>
                            <Card
                                title="CCWM"
                                info={
                                    Math.round(ccwmStat.value * 100) / 100 + ''
                                }
                                subinfo={
                                    Math.round(ccwmStat.percentile * 10) / 10 +
                                    '% Percentile'
                                }
                            ></Card>
                        </HStack>

                        <Grid
                            // gap={1}
                            templateColumns={
                                'repeat(auto-fit, minmax(150px, 1fr))'
                            }
                            width={'65vw'}
                        >
                            {/* {Object.entries(avgValues).map(([key, value]) => {
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
                            })} */}
                            <Card
                                title={'Average Auton Points'}
                                info={
                                    parseFloat(
                                        avgValues.autonPoints + '',
                                    ).toFixed(3) + ''
                                }
                            />
                            <Card
                                title={'Average Teleop Points'}
                                info={
                                    parseFloat(
                                        avgValues.teleopPoints + '',
                                    ).toFixed(3) + ''
                                }
                            />
                            <Card
                                title={'Average Endgame Points'}
                                info={
                                    parseFloat(
                                        avgValues.endgamePoints + '',
                                    ).toFixed(3) + ''
                                }
                            />
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
    const renderDriveteamView = () => {
        const teleopMade = [
            'Teleop Made',
            (
                (avgValues['Teleop Upper'] + avgValues['Teleop Bottom']) /
                (avgValues['Teleop Upper'] +
                    avgValues['Teleop Bottom'] +
                    avgValues['Teleop Missed'])
            ).toFixed(2),
        ];
        const teleopPoints = [
            'teleopPoints',
            parseFloat(avgValues['teleopPoints'] + '').toFixed(2),
        ];
        const autonMade = [
            'Auton Made',
            (
                (avgValues['Auton Upper'] + avgValues['Auton Bottom']) /
                (avgValues['Auton Upper'] +
                    avgValues['Auton Bottom'] +
                    avgValues['Auton Missed'])
            ).toFixed(2),
        ];
        const autonPoints = [
            'autonPoints',
            parseFloat(avgValues['autonPoints'] + '').toFixed(2),
        ];
        const relevantFields = [
            teleopMade,
            teleopPoints,
            autonMade,
            autonPoints,
        ];
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
                            {relevantFields.map(([key, value]) => {
                                return (
                                    <Card
                                        title={'Average ' + key}
                                        info={value + ''}
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
    if (loading) return <Spinner />;
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
        {
            stat: 'CCWM',
            value: parseFloat(ccwm.value.toFixed(3)),
            max: ccwm.max,
        },
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
