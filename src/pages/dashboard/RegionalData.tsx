import { AddIcon } from '@chakra-ui/icons';
import { Button, Heading, IconButton, Spinner, Tooltip } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Graph from '../../components/Graph';
import GraphInput from '../../components/GraphInput';
import { db } from '../../firebase';
import Paper from '@mui/material/Paper';
import { TableContainer, Table, TableHead, TableRow, TableBody, TableCell } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material';

interface RouteParams {
    year: string;
    regional: string;
}

const RegionalData: FC<RouteComponentProps<RouteParams>> = ({ match }) => {
    const [sortBy, setSortBy] = useState<string>();
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
    useEffect(() => {
        const regionalDisplay = localStorage.getItem('regionalDisplay' + year);
        if (regionalDisplay) setGraphs(JSON.parse(regionalDisplay));
        else
            setPresetGraphs();
    }, [year]);

    const setPresetGraphs = async () => {
        await db.collection('years')
            .doc(year)
            .collection('regionals')
            .doc(regional)
            .collection("presetGraphs")
            .doc('regionals')
            .get()
            .then((doc) => {
                const temp: any[] = [];
                doc.data()!["graphs"]?.forEach((preset: any) => {
                    temp.push({
                        x: preset["xAxis"],
                        y: [preset["yAxis1"], preset["yAxis2"], preset["yAxis3"]],
                        type: preset["graphType"]
                    });
                });
                setGraphs(temp);
            });
    }
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
                teams[index] = { ...teams[index], ...doc.data() };
            });
            setTemplate(Object.keys(teams[0]).length > Object.keys(teams[1]).length ? Object.keys(teams[0]) : Object.keys(teams[1]));
            setTeams(teams);
        };
        fetchData().then(() => setLoading(false));
    }, [regional, year]);
    if (!teams || !teams.length) return null;
    if (loading) return <Spinner />;
    const renderGraphs = () => {

        return (
            <div>
                {graphs.map((graph, index) => (
                    <>
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
                                    sortBy: 'teleopPoints',
                                    type: 'Bar',
                                }
                            }
                            sortBy={sortBy ? sortBy : ''}
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

    const renderTable = () => {
        const teamTemplate = Object.keys(teams[0]).length > Object.keys(teams[1]).length ? teams[0] : teams[1];
        return (
            <ThemeProvider theme={createTheme()}>
                <TableContainer component={Paper} style={{ minWidth: "90vw", maxHeight: "90vw" }}>
                    <Table stickyHeader sx={{ minWidth: 950, width: '90vw' }}>
                        <TableHead>
                            <TableRow style={{ whiteSpace: "nowrap" }}>
                                <TableCell key="teamNum">
                                    Team Number
                                    <Button onClick={() => {
                                        sort(false, "teamNum");
                                    }}>
                                        ↑
                                    </Button>
                                    <Button onClick={() => {
                                        sort(true, "teamNum");
                                    }}>
                                        ↓
                                    </Button>
                                </TableCell>
                                {(template.map((key) => {
                                    if (key != "teamNum")
                                        return (
                                            <TableCell key={key}>
                                                {key}
                                                <Button onClick={() => {
                                                    sort(false, key);
                                                }}>
                                                    ↑
                                                </Button>
                                                <Button onClick={() => {
                                                    sort(true, key)
                                                }}>
                                                    ↓
                                                </Button>
                                            </TableCell>
                                        );
                                }))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {teams.map((team) => (
                                <TableRow key={team["teamNum"]}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell key={team["teamNum"] + "teamNum"}>{team["teamNum"]}</TableCell>
                                    {Object.keys(teamTemplate).map((field) => {
                                        if (field != "teamNum")
                                            return (
                                                team[field] !== undefined ? <TableCell key={team["teamNum"] + field}>{JSON.stringify(team[field]).indexOf('.') == -1 ? team[field] : parseFloat(team[field]).toFixed(3)}</TableCell> : <TableCell></TableCell>
                                            );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </ThemeProvider>
        );
    }

    return (
        <div style={{ width: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5%' }}>
            <Heading textAlign={'center'} fontSize={'1.5em'} marginBottom="3%">
                {regional.toUpperCase()} {year}
            </Heading>
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
};

export default RegionalData;
