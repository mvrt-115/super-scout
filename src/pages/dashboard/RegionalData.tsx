import { AddIcon } from '@chakra-ui/icons';
import { Button, Heading, IconButton, Spinner, Tooltip, Text } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import Graph from '../../components/Graph';
import GraphInput from '../../components/GraphInput';
import { db, functions, auth } from '../../firebase';
import Paper from '@mui/material/Paper';
import { TableContainer, Table, TableHead, TableRow, TableBody, TableCell } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material';
import RegionalTable from '../../components/RegionalTable';
interface RouteParams {
    year: string;
    regional: string;
}

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
                            delete temp["Team Number"];
                            temp["teamNum"] = parseInt(doc.id);
                            data.push(temp);
                        }))
                }
            });
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
        if (year == '2022' && regional == 'cafr')
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

    const renderTable = () => {
        return (
            <ThemeProvider theme={createTheme()}>
                <RegionalTable teamTemplate={template} teamList={teams} />
            </ThemeProvider>
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
                                                {/*<Button onClick={() => {
                                                sort(false, "teamNum");
                                            }}>
                                                ↑
                                            </Button>
                                            <Button onClick={() => {
                                                sort(true, "teamNum")
                                            }}>
                                                ↓
                                        </Button>*/}
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
            <div style={{ width: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5%' }}>
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
                {table ? renderTable() : renderGraphs()}
            </div>
        );
    }


    return (
        <>
            <div>
                <li className="link" style={{
                    padding: "none",
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
                </li>
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
                    const resetData = functions.httpsCallable('resetData');
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
