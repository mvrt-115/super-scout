import { Button } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import { TableContainer, Table, TableHead, TableRow, TableBody, TableCell, ThemeProvider, createTheme } from '@mui/material';

interface RegionalTableProps {
    pTemplate: string[];
    pList: any[];
    base: string;
}

const RegionalTable: FC<RegionalTableProps> = ({pTemplate, pList, base}) => {
    const [list, setList] = useState<any[]>([...pList]);
    const [template, setTemplate] = useState<string[]>(pTemplate);
    const sort = (ascending: boolean, key: string) => {
        let temp = [...list];
        temp.sort((a, b) => {
            if (a === undefined) {
                return 1;
            }
            if (b === undefined) {
                return -1;
            }
            return ascending ? a[key] - b[key] : b[key] - a[key];
        })
        setList(temp);
    }
    return (
        <ThemeProvider theme={createTheme()}>
            <TableContainer component={Paper} style={{ maxWidth: "95vw", maxHeight: "90vw" }}>
                <Table stickyHeader sx={{ minWidth: 950, width: '90vw' }}>
                    <TableHead>
                        <TableRow style={{ whiteSpace: "nowrap" }}>
                            <TableCell key={base}>
                                    {base}
                                <Button onClick={() => {
                                    sort(false, base);
                                }}>
                                    ↑
                                </Button>
                                <Button onClick={() => {
                                    sort(true, base);
                                }}>
                                    ↓
                                </Button>
                            </TableCell>
                            {(template.map((key) => {
                                if (key != base)
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
                        {list.map((element) => (
                            <TableRow key={element[base]}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell key={element[base] + base}>{element[base]}</TableCell>
                                {template.map((field) => {
                                    if (field != base)
                                        return (
                                            <TableCell key={element[base] + field}>{!Number.isNaN(parseFloat(element[field])) && JSON.stringify(element[field]).indexOf(".")>-1 ? parseFloat(element[field]).toFixed(3) : JSON.stringify(element[field])}</TableCell>
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
export default RegionalTable;
