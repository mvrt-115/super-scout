import { AddIcon } from '@chakra-ui/icons';
import { Button, Heading, IconButton, Spinner, Tooltip, Text } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Graph from './Graph';
import GraphInput from './GraphInput';
import { db } from '../firebase';
import Paper from '@mui/material/Paper';
import { TableContainer, Table, TableHead, TableRow, TableBody, TableCell } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material';

interface RegionalTableProps {
    teamTemplate: string[];
    teamList: any[];
}

const RegionalTable: FC<RegionalTableProps> = ({teamTemplate, teamList}) => {
    const [teams, setTeams] = useState<any[]>([...teamList]);
    const [template, setTemplate] = useState<string[]>(teamTemplate);
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
    return (
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
                                    {template.map((field) => {
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
    );
}
export default RegionalTable;
