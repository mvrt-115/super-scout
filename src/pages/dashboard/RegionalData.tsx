import { AddIcon } from '@chakra-ui/icons';
import { Button, Heading, IconButton, Spinner, Tooltip, Text } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import Graph from '../../components/displays/Graph';
import GraphInput from '../../components/displays/GraphInput';
import { db, functions, auth } from '../../firebase';
import Paper from '@mui/material/Paper';
import { TableContainer, Table, TableHead, TableRow, TableBody, TableCell, ThemeProvider, createTheme } from '@mui/material';
import DataTable from '../../components/displays/DataTable';
interface RouteParams {
    year: string;
    regional: string;
}
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
        autonPoints += (2 * matchData['Auton Bottom']) + (4 * matchData['Auton Upper']);
        if (matchData['Left Tarmac'] === undefined)
            autonPoints += (2 * +matchData['Leave Tarmac']);
        else autonPoints += (2 * +matchData['Left Tarmac'])
        return autonPoints;
    }
    else if (year == '2023') {
        let autonPoints: number = 6 * (matchData['Auton Upper Cone'] + matchData['Auton Upper Cube']) + 4 * (matchData['Auton Mid Cone'] + matchData['Auton Mid Cube']) + 3 * (matchData['Auton Lower Cube'] + matchData['Auton Lower Cone'])
        if (matchData['Auton Engaged']) {
            autonPoints += 12;
        }
        else if (matchData['Auton Docked']) {
            autonPoints += 8;
        }
        if (matchData["Mobility"]) {
            autonPoints += 3;
        }
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
    else if (year == '2023') {
        return 5 * (matchData['Teleop Upper Cone'] + matchData['Teleop Upper Cube']) + 3 * (matchData['Teleop Mid Cone'] + matchData['Teleop Mid Cube']) + 2 * (matchData['Teleop Lower Cone'] + matchData['Teleop Lower Cube']);
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
    else if (year = '2023') {
        let endgamePoints: number = 0;
        if (matchData['Endgame Engaged']) {
            endgamePoints += 10;
        }
        else if (matchData['Endgame Docked']) {
            endgamePoints += 6;
        }
        if (matchData['Parked']) {
            endgamePoints += 2;
        }
        return endgamePoints;
    }
    return -1;
};
const resetData = async (data: any) => {
    const { year, regional, team } = data;
    let matchCount: number = 0;
    let newData: any = {};
    await db
        .collection('years')
        .doc(year)
        .collection('regionals')
        .doc(regional)
        .collection('teams')
        .doc(team)
        .collection('matches')
        .get()
        .then((data) => {
            matchCount = data.docs.length;
            data.docs.forEach((match) => {
                const matchData = match.data();
                const keys = Object.keys(matchData || {});
                Object.values(matchData || {}).forEach(
                    (value: string | number | boolean, index: number) => {
                        if (
                            typeof value === 'number' &&
                            keys[index] !== 'matchNum'
                        ) {
                            if (newData[keys[index]] === undefined)
                                newData[keys[index]] = value;
                            else newData[keys[index]] += value;
                        }
                    },
                );
                const autonPoints = calcAutonPoints(matchData, year);
                if (newData['autonPoints']) newData.autonPoints += autonPoints;
                else newData['autonPoints'] = autonPoints;
                const teleopPoints = calcTeleopPoints(matchData, year);
                if (newData['teleopPoints'])
                    newData.teleopPoints += teleopPoints;
                else newData['teleopPoints'] = teleopPoints;
                const endgamePoints = calcEndgamePoints(matchData, year);
                if (newData['endgamePoints'])
                    newData.endgamePoints += endgamePoints;
                else newData['endgamePoints'] = endgamePoints;
            });
        });
    Object.keys(newData).forEach(
        (key: string) =>
            (newData[key] =
                Math.floor((newData[key] / matchCount) * 1000) / 1000),
    );
    newData.teamNum = team;
    return newData;
};

const RegionalData: FC<RouteComponentProps<RouteParams>> = ({ match }) => {
    const [teams, setTeams] = useState<any[]>([]);
    const [table, setTable] = useState<boolean>(false);
    const [graphs, setGraphs] = useState<any[]>([
        {
            x: 'teamNum',
            y: ['autonPoints', 'teleopPoints', 'endgamePoints'],
            type: 'Bar',
        },
    ]);
    const { year, regional } = match.params;
    const [loading, setLoading] = useState<boolean>(true);
    const [template, setTemplate] = useState<string[]>(['']);
    const [pitTemplate, setPitTemplate] = useState<string[]>(['']);
    const [pitScout, setPitScout] = useState<boolean>(false);
    const [pitScoutData, setPitScoutData] = useState<any[]>([{}]);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    auth.onAuthStateChanged((user) => setIsLoggedIn(user !== null));

    useEffect(() => {
        console.clear();
        const regionalDisplay = localStorage.getItem('regionalDisplay' + year);
        if (regionalDisplay) setGraphs(JSON.parse(regionalDisplay));
        else
            setPresetGraphs();
    }, [year, isLoggedIn]);

    const setPresetGraphs = async () => {
        await db.collection('years')
            .doc(year)
            .collection('regionals')
            .doc(regional)
            .collection("presetGraphs")
            .doc('regional')
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
    
    useEffect(() => {
        console.clear();
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
            let teams: any = regionalRef.docs.map((doc)=> doc.data());
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
                teams[index] = { ...teams[index], ...doc.data() };
            });
            setTemplate(Object.keys(teams[0]).length > Object.keys(teams[1]).length ? Object.keys(teams[0]) : Object.keys(teams[1]));
            setTeams(teams);
        };

        const fetchPitScoutData = async () => {
            let data: any[] = [];
            const path = db
                .collection('years')
                .doc(year)
                .collection('regionals')
                .doc(regional)
                .collection('teams');
            let promiseList: Promise<any>[] = [];
            await path.get().then((docList) => {
                for (let doc of docList.docs) {
                    promiseList.push(path.doc(doc.id).collection("pitScoutData").doc("pitScoutAnswers").get()
                        .then((resp) => {
                            let temp: any = resp.data()!;
                            console.log(temp);
                            if(!temp) return;
                            if(temp["Team Number"])
                                delete temp["Team Number"];
                            temp["teamNum"] = parseInt(doc.id);
                            data.push(temp);
                        }))
                }
            });
            console.log(data);
            console.log("HI")
            await Promise.all(promiseList);
            setPitScoutData(data);
            let temp: string[] = ["teamNum"];
            for (let team of data) {
                if (Object.keys(team).length > temp.length) {
                    temp = Object.keys(team);
                }
            }
            setPitTemplate(temp);
        }
        if (year === '2022' && regional === 'cafr' || parseInt(year)>=2023)
            fetchData().then(() => fetchPitScoutData().then(() => setLoading(false)));
        else fetchData().then(() => setLoading(false));
    }, [regional, year]);

    if (loading) return <Spinner />;
    const renderGraphs = () => {
        return (
            <div>
                {graphs.map((graph, index) => (
                    <div style={{
                        width: '100%'
                    }}>
                        <GraphInput
                            keys={template}
                            graphData={graph}
                            onChange={(graphData) => {
                                let newGraphs = [...graphs];
                                newGraphs[index] = graphData;
                                setGraphs(newGraphs);
                                localStorage.setItem(
                                    'regionalDisplay' + year,
                                    JSON.stringify(newGraphs),
                                );
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
                                    sortBy: 'teleopPoints',
                                    type: 'Bar',
                                }
                            }
                        />
                    </div>
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
                                    sortBy: 'ranking'
                                },
                            ])
                        }
                        colorScheme="green"
                        width="100%"
                    />
                </Tooltip>
            </div>

        );
    }
     
    const sort = (ascending: boolean, key: string) => {
        let temp = [...teams];
        temp.sort((a, b) => {
            if (a === undefined) {
                return 1;
            }
            if (b === undefined) {
                return -1;
            }
            return ascending ? a[key] - b[key] : b[key] - a[key];
        })
        setTeams(temp);
    }
    const renderPitScout = () => {
        return (
            <>
                <Text>
                    This is the pitscout page!
                </Text>
                <ThemeProvider theme={createTheme()}>
                    <TableContainer component={Paper} style={{ minWidth: '90vw', minHeight: '90vh' }}>
                        <TableHead>
                            <TableRow style={{ whiteSpace: 'nowrap' }}>
                                <TableCell key="teamNum">
                                    Team Number
                                </TableCell>
                                {pitTemplate.map((field: any, index: number) => {
                                    if (field !== "teamNum")
                                        return (
                                            <TableCell key={field}>
                                                {field}
                                            </TableCell>
                                        );
                                })}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pitScoutData.map((teamData: any, index: number) => {
                                return (
                                    <TableRow key={teamData['teamNum']}>
                                        <TableCell key={teamData['teamNum'] + 'teamNum'}>{teamData['teamNum']}</TableCell>
                                        {pitTemplate.map((key: any, index: number) => {
                                            return (
                                                teamData[key] !== undefined && key !== 'teamNum'
                                                && <TableCell key={teamData['teamNum'] + key}>
                                                    {JSON.stringify(teamData[key]).length > 5 ?
                                                        JSON.stringify(teamData[key]) ://.substring(0, 5) + "..." :
                                                        JSON.stringify(teamData[key])
                                                    }
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </TableContainer>
                </ThemeProvider>
            </>
        );
    }

    const renderQualitativeData = () => {
        if (!teams || !teams.length)
            return (
                <Text>
                    There are no matches available!
                </Text>
            );
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5%' }}>
                <div>
                    {table ? <Button
                        variant="outline"
                        aria-label="Table"
                        onClick={() => {
                            setTable(false);
                        }}
                        width={'100%'}
                        marginTop={4}
                        marginBottom={4}
                        colorScheme={'mv-purple'}
                    >
                        Graphs
                    </Button> :
                        <Button
                            variant="outline"
                            aria-label="Table"
                            onClick={() => {
                                setTable(true);
                            }}
                            width={'100%'}
                            marginTop={4}
                            marginBottom={4}
                            colorScheme={'mv-purple'}
                        >
                            Table
                        </Button>}
                </div>
                {table ? <DataTable pTemplate={template} pList={teams} base="teamNum"/> : renderGraphs()}
            </div>
        );
    }


    return (
        <>
            <div>
                <div style={{
                    paddingBottom: "1rem",
                    margin: "none",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: '1.5em',
                    backgroundColor: "white",
                    color: 'black'
                }}>
                    <Link
                        to={`..`}
                    >
                        {regional.toUpperCase()} {year}
                    </Link>
                </div>
                {<Button
                    onClick={() => {
                        setPitScout(!pitScout);
                    }}
                >
                    {(pitScout ? 'View Regional Data' : 'View Pit scout data')}
                </Button>}
            </div>
            {pitScout ? renderPitScout() : renderQualitativeData()}
            {isLoggedIn && < Button
                onClick={() => {
                    console.clear();
                    const teamsRef = db
                        .collection('years')
                        .doc(year)
                        .collection('regionals')
                        .doc(regional)
                        .collection('teams');
                    teamsRef.get().then(async (teamData) => {
                        teamData.docs.forEach((team: any) => resetData({ year, regional, team: team.id })
                            .then(async (newData) => await teamsRef.doc(team.id).set(newData.data)));
                    });
                }}
            >
                Reset Data Values
            </Button>}
        </>
    );
};

export default RegionalData;
