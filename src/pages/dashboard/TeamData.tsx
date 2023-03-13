import { AddIcon } from '@chakra-ui/icons';
import {
    Button,
    Center,
    Flex,
    Grid,
    Heading,
    HStack,
    IconButton,
    Image,
    Spinner,
    Stack,
    Text,
    Tooltip,
    useMediaQuery,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import Graph from '../../components/displays/Graph';
import GraphInput from '../../components/displays/GraphInput';
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
import DataTable from '../../components/displays/DataTable';
import { getTsBuildInfoEmitOutputFilePath } from 'typescript';
import { storage } from 'firebase-functions/v1';
import firebase from 'firebase';
import ClimbPieChart from '../../components/displays/ClimbPieChart';
import GenericPieChart from '../../components/displays/PieChart';
import PitScoutData from '../../components/displays/PitScoutData';
import HeatMap from '../../components/displays/Heatmap';

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
    const [isLargerThan800] = useMediaQuery('(min-width: 770px)');
    const { year, regional, team } = match.params;
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
    const [teamImage, setTeamImage] = useState('');
    const [dtMode, setdtMode] = useState<boolean>(false);

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

        const fetchTeamImage = async () => {
            await firebase
                .storage()
                .ref()
                .child(`robotImages/${year}/${regional}/${team}`)
                .getDownloadURL()
                .then((result) => {
                    console.log(result);
                    setTeamImage(result);
                })
                .catch((err) => console.log(err));
        };
        fetchQuantitativeData().then(fetchQualitativeData).then(fetchTeamImage);
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
                    outerRadius={150}
                    label
                    paddingAngle={2}
                />
                <REToolTip />
            </PieChart>
        );
    };

    const renderHeatmap = () => {
        if (year === '2023')
            return (
                <Stack justifyContent={'center'} alignItems="center">
                    <Heading size="md" textAlign={'center'}>
                        Scoring Heatmap:
                    </Heading>
                    <Flex
                        flexDir={'row'}
                        justifyContent="space-between"
                        width={'80%'}
                    >
                        <Stack alignItems={'center'}>
                            <Heading size="md">Auton:</Heading>
                            <HStack>
                                <HeatMap
                                    matches={matches}
                                    fields={[
                                        'Auton Upper Cube',
                                        'Auton Mid Cube',
                                        'Auton Lower Cube',
                                    ]}
                                    rows={3}
                                    r="85"
                                    g="5"
                                    b="117"
                                    columns={1}
                                />
                                <HeatMap
                                    matches={matches}
                                    fields={[
                                        'Auton Upper Cone',
                                        'Auton Mid Cone',
                                        'Auton Lower Cone',
                                    ]}
                                    rows={3}
                                    columns={1}
                                    r="255"
                                    g="195"
                                    b="16"
                                />
                            </HStack>
                        </Stack>
                        <Stack alignItems={'center'}>
                            <Heading size="md">Teleop:</Heading>
                            <HStack>
                                <HeatMap
                                    matches={matches}
                                    fields={[
                                        'Teleop Upper Cube',
                                        'Teleop Mid Cube',
                                        'Teleop Lower Cube',
                                    ]}
                                    rows={3}
                                    r="85"
                                    g="5"
                                    b="117"
                                    columns={1}
                                />
                                <HeatMap
                                    matches={matches}
                                    fields={[
                                        'Teleop Upper Cone',
                                        'Teleop Mid Cone',
                                        'Teleop Lower Cone',
                                    ]}
                                    rows={3}
                                    columns={1}
                                    r="255"
                                    g="195"
                                    b="16"
                                />
                            </HStack>
                        </Stack>
                    </Flex>
                </Stack>
            );
        return <></>;
    };
    //---
    const renderGraphs = () => {
        return (
            <>
                {graphs.map((graph, index) => (
                    <Flex
                        flexDir="column"
                        justifyContent="center"
                        alignItems={'center'}
                    >
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
                    </Flex>
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
                {year === '2022' && <ClimbPieChart matches={matches} />}
            </>
        );
    };
    //--
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
            <div>
                <Flex
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    width="100%"
                >
                    <Flex
                        flexDirection={isLargerThan800 ? 'row' : 'column'}
                        justifyContent="center"
                        width="100%"
                    >
                        <div>
                            {renderGeneralInfo()}
                            <HStack>
                                <Card
                                    title="OPR"
                                    info={
                                        Math.round(oprStat.value * 10) / 10 + ''
                                    }
                                    subinfo={
                                        Math.round(oprStat.percentile * 10) /
                                        10 +
                                        '% Percentile'
                                    }
                                />
                                <Card
                                    title="DPR"
                                    info={
                                        Math.round(dprStat.value * 10) / 10 + ''
                                    }
                                    subinfo={
                                        Math.round(dprStat.percentile * 10) /
                                        10 +
                                        '% Percentile'
                                    }
                                />
                                <Card
                                    title="CCWM"
                                    info={
                                        Math.round(ccwmStat.value * 10) / 10 +
                                        ''
                                    }
                                    subinfo={
                                        Math.round(ccwmStat.percentile * 10) /
                                        10 +
                                        '% Percentile'
                                    }
                                />
                            </HStack>
                            <HStack>
                                <Card
                                    title={'Average Auton Points'}
                                    info={
                                        parseFloat(
                                            avgValues.autonPoints + '',
                                        ).toFixed(1) + ''
                                    }
                                />
                                <Card
                                    title={'Average Teleop Points'}
                                    info={
                                        parseFloat(
                                            avgValues.teleopPoints + '',
                                        ).toFixed(1) + ''
                                    }
                                />
                                <Card
                                    title={'Average Endgame Points'}
                                    info={
                                        parseFloat(
                                            avgValues.endgamePoints + '',
                                        ).toFixed(1) + ''
                                    }
                                />
                            </HStack>
                        </div>
                        <Stack justifyContent={'center'} alignItems={'center'}>
                            {renderHeatmap()}
                            {/* <TeamRadarChartWrapper
                                team={team}
                                opr={oprStat}
                                dpr={dprStat}
                                ccwm={ccwmStat}
                            /> */}
                        </Stack>
                    </Flex>
                </Flex>

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
                {table ? (
                    <DataTable
                        pTemplate={template}
                        pList={matches}
                        base="matchNum"
                    />
                ) : (
                    renderGraphs()
                )}
            </div>
        );
    };

    const renderDriveteamView = () => {
        if (year == '2023') {
            // Will turn into one loop later

            const coneLow = matches.reduce(
                (cones, match) =>
                    cones + match['Auton Lower Cone'] + match['Teleop Lower Cone'],
                0,
            );

            const coneMid = matches.reduce(
                (cones, match) =>
                    cones + match['Auton Mid Cone'] + match['Teleop Mid Cone'],
                0,
            );
            const coneHigh = matches.reduce(
                (cones, match) =>
                    cones +
                    match['Auton Upper Cone'] +
                    match['Teleop Upper Cone'],
                0,
            );
            const cubeLow = matches.reduce(
                (cubes, match) =>
                    cubes + match['Auton Lower Cube'] + match['Teleop Lower Cube'],
                0,
            );

            const cubeMid = matches.reduce(
                (cubes, match) =>
                    cubes + match['Auton Mid Cube'] + match['Teleop Mid Cube'],
                0,
            );
            const cubeHigh = matches.reduce(
                (cubes, match) =>
                    cubes +
                    match['Auton Upper Cube'] +
                    match['Teleop Upper Cube'],
                0,
            );

            const cubeLowMissed = matches.reduce(
                (missed, match) =>
                    missed +
                    match['Auton Lower Cube Missed'] +
                    match['Teleop Lower Cube Missed'],
                0,
            );

            const cubeMidMissed = matches.reduce(
                (missed, match) =>
                    missed +
                    match['Auton Mid Cube Missed'] +
                    match['Teleop Mid Cube Missed'],
                0,
            );
            const cubeHighMissed = matches.reduce(
                (missed, match) =>
                    missed +
                    match['Auton Upper Cube Missed'] +
                    match['Teleop Upper Cube Missed'],
                0,
            );
            const coneLowMissed = matches.reduce(
                (missed, match) =>
                    missed +
                    match['Auton Lower Cone Missed'] +
                    match['Teleop Lower Cone Missed'],
                0,
            );

            const coneMidMissed = matches.reduce(
                (missed, match) =>
                    missed +
                    match['Auton Mid Cone Missed'] +
                    match['Teleop Mid Cone Missed'],
                0,
            );
            const coneHighMissed = matches.reduce(
                (missed, match) =>
                    missed +
                    match['Auton Upper Cone Missed'] +
                    match['Teleop Upper Cone Missed'],
                0,
            );

            const dtType = pitScoutData['DT Type'];
            const averagePointsPerMatch =
                avgValues['autonPoints'] +
                avgValues['endgamePoints'] +
                avgValues['teleopPoints'];
            const matchesPlayed = avgValues['matches'];

            const autonCharge = matches.reduce(
                (charged, match) => charged + match['Auton Did Charge'],
                0,
            );
            const teleopCharge = matches.reduce(
                (charged, match) => charged + match['Endgame Did Charge'],
                0,
            );
            const teleopDocked = matches.reduce(
                (docked, match) => docked + match['Endgame Docked'],
                0,
            );
            const autonDocked = matches.reduce(
                (docked, match) => docked + match['Auton Docked'],
                0,
            );
            const autonEngaged = matches.reduce(
                (engaged, match) => engaged + match['Auton Engaged'],
                0,
            );
            const teleopEngaged = matches.reduce(
                (engaged, match) => engaged + match['Endgame Engaged'],
                0,
            );
            const chargeTime =
                matches.reduce(
                    (time, match) => time + match['Endgame Charge Time'],
                    0,
                ) / teleopCharge;

            if (!matches || !matches.length) {
                return (
                    <Text
                        style={{
                            marginTop: '1rem',
                        }}
                    >
                        No scouting data available!
                    </Text>
                );
            }
            return (
                <div>
                    <Flex flexDir={['column', 'column', 'row', 'row']} justifyContent="flex-start">
                        <Flex flexDir={'column'} justifyContent="flex-start" p={'5%'}>
                            {renderGeneralInfo()}
                            <Grid
                                templateColumns={['repeat(2, minmax(150px, 1fr))', 'repeat(2, minmax(150px, 1fr))', 'repeat(3, minmax(150px, 1fr))', 'repeat(3, minmax(150px, 1fr))']}
                            >
                                <Card
                                    height="150px"
                                    width="150px"
                                    title={'Drivetrain'}
                                    info={dtType}
                                    colorTheme={200}
                                />
                                <Card
                                    height="150px"
                                    width="150px"
                                    title={'Average Cubes'}
                                    info={
                                        '' +
                                        (
                                            (cubeLow + cubeHigh + cubeMid) /
                                            matchesPlayed
                                        ).toFixed(2)
                                    }
                                    colorTheme={200}
                                    subinfo={
                                        'Accuracy: ' +
                                        (
                                            ((cubeHigh + cubeMid + cubeLow) /
                                                (cubeHigh +
                                                    cubeMid +
                                                    cubeHighMissed +
                                                    cubeMidMissed + cubeLow + cubeLowMissed)) *
                                            100
                                        ).toFixed(0) +
                                        '%'
                                    }
                                ></Card>
                                <Card
                                    height="150px"
                                    width="150px"
                                    title={'Average Cones'}
                                    info={
                                        '' +
                                        (
                                            (coneHigh + coneMid + coneLow) /
                                            matchesPlayed
                                        ).toFixed(2)
                                    }
                                    colorTheme={200}
                                    subinfo={
                                        'Accuracy: ' +
                                        (
                                            ((coneHigh + coneMid + coneLow) /
                                                (coneHigh +
                                                    coneMid +
                                                    coneHighMissed +
                                                    coneMidMissed + coneLow + coneLowMissed)) *
                                            100
                                        ).toFixed(0) +
                                        '%'
                                    }
                                ></Card>
                                <Card
                                    height="150px"
                                    width="150px"
                                    title={'Charge Time'}
                                    info={chargeTime.toFixed(2) + ' s'}
                                    colorTheme={200}
                                ></Card>
                                <Card
                                    height="150px"
                                    width="150px"
                                    title={'Average Points Per Match'}
                                    info={averagePointsPerMatch.toFixed(2)}
                                    subinfo={'Matches Played: ' + matchesPlayed}
                                    colorTheme={200}
                                ></Card>
                            </Grid>
                        </Flex>

                        <Stack direction={['column', 'column', 'row', 'row']}>
                            <Stack>
                                <Heading textAlign="center" size={'md'}>
                                    Score Distribution:
                                </Heading>
                                <GenericPieChart
                                    radius={100}
                                    height={275}
                                    width={450}
                                    valueObject={{
                                        Low: coneLow + cubeLow,
                                        Mid: coneMid + cubeMid,
                                        High: coneHigh + cubeHigh,
                                    }}
                                    colors={{
                                        Low: '800',
                                        Mid: '200',
                                        High: '1',
                                    }}
                                ></GenericPieChart>
                                <Heading textAlign="center" size={'md'}>
                                    Cone/Cube Distribution:
                                </Heading>
                                <GenericPieChart
                                    height={275}
                                    width={450}
                                    radius={100}
                                    valueObject={{
                                        'Low Cone': coneLow,
                                        'Mid Cone': coneMid,
                                        'High Cone': coneHigh,
                                        'High Cube': cubeHigh,
                                        'Mid Cube': cubeMid,
                                        'Low Cube': cubeLow
                                    }}
                                    colors={{
                                        'Mid Cone': '1000',
                                        'High Cone': '700',
                                        'High Cube': '100',
                                        'Mid Cube': '300',
                                    }}
                                ></GenericPieChart>
                            </Stack>
                            <Stack alignItems={'center'} marginRight={'15px'}>
                                <Heading textAlign="center" size={'md'}>
                                    Auton Charge:
                                </Heading>
                                <GenericPieChart
                                    radius={100}
                                    height={275}
                                    width={450}
                                    valueObject={{
                                        'No Attempt':
                                            matchesPlayed - autonCharge,
                                        Failed: autonCharge - autonDocked,
                                        Docked: autonDocked - autonEngaged,
                                        Engaged: autonEngaged,
                                    }}
                                    colors={{
                                        'No Attempt': '1000',
                                        Failed: '600',
                                        Docked: '100',
                                        Engaged: '1',
                                    }}
                                ></GenericPieChart>
                                <Heading textAlign="center" size={'md'}>
                                    Teleop Charge:
                                </Heading>
                                <GenericPieChart
                                    radius={100}
                                    height={275}
                                    width={450}
                                    valueObject={{
                                        'No Attempt':
                                            matchesPlayed - teleopCharge,
                                        Failed: teleopCharge - teleopCharge,
                                        Docked: teleopDocked - teleopEngaged,
                                        Engaged: teleopEngaged,
                                    }}
                                    colors={{
                                        'No Attempt': '1000',
                                        Failed: '600',
                                        Docked: '100',
                                        Engaged: '1',
                                    }}
                                ></GenericPieChart>
                            </Stack>
                        </Stack>
                    </Flex>

                    <div>
                        <Stack alignItems={'center'}>
                            <Grid
                                templateColumns={
                                    'repeat(auto-fit, minmax(150px, 1fr))'
                                }
                                width={'65vw'}
                            ></Grid>
                        </Stack>
                    </div>
                </div>
            );
        }
    };

    const renderGeneralInfo = () => {
        return (
            <HStack alignItems={'flex-start'}>
                {teamImage !== '' && (
                    <Image
                        src={teamImage}
                        boxSize="150px"
                        objectFit={'cover'}
                        alt="team"
                        border="2px"
                        borderRadius="25px"
                    />
                )}
                <Stack>
                    <Heading
                        textAlign={'center'}
                        fontSize={'1.5em'}
                        fontWeight={'bolder'}
                    >
                        Team # {team}
                    </Heading>
                    <Heading
                        textAlign={'center'}
                        fontSize={'0.75em'}
                        fontWeight={'bolder'}
                    >
                        Rank # {ranking}
                    </Heading>
                    {year === '2023' ? (
                        <Button
                            size={'sm'}
                            onClick={() => {
                                setdtMode(!dtMode);
                            }}
                            colorScheme={dtMode ? 'mv-purple' : 'gray'}
                        >
                            {dtMode
                                ? 'Disable Driveteam Mode'
                                : 'Enable Driveteam Mode'}
                        </Button>
                    ) : (
                        <></>
                    )}
                    {!dtMode && (
                        <Button
                            size={'sm'}
                            onClick={() => {
                                setPitScout(!pitScout);
                            }}
                        >
                            {pitScout
                                ? 'View Scouting Data'
                                : 'View Pit Scouting data'}
                        </Button>
                    )}
                </Stack>
            </HStack>
        );
    };

    if (loading) return <Spinner />;
    return (
        <>
            {dtMode ? (
                renderDriveteamView()
            ) : pitScout ? (
                <PitScoutData data={pitScoutData} />
            ) : (
                renderScoutingData()
            )}
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
