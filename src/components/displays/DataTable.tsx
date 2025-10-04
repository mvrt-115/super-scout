import { Button } from '@chakra-ui/react';
import React, { FC, useState } from 'react';
import Paper from '@mui/material/Paper';
import { TableContainer, Table, TableHead, TableRow, TableBody, TableCell, ThemeProvider, createTheme } from '@mui/material';

interface RegionalTableProps {
    pTemplate: string[];
    pList: any[];
    base: string;
}

const RegionalTable: FC<RegionalTableProps> = ({ pTemplate, pList, base }) => {
    const [list, setList] = useState<any[]>([...pList]);
    const [template] = useState<string[]>(pTemplate);

    const sort = (ascending: boolean, key: string) => {
        let temp = [...list];
        temp.sort((a, b) => {
            if (a === undefined) return 1;
            if (b === undefined) return -1;
            return ascending ? a[key] - b[key] : b[key] - a[key];
        });
        setList(temp);
    };

    return (
        <ThemeProvider theme={createTheme()}>
            <TableContainer component={Paper} style={{ maxWidth: "95vw", maxHeight: "90vh", overflowX: "auto", position: "relative" }}>
                <Table stickyHeader sx={{ minWidth: 950, width: '90vw' }}>
                    <TableHead>
                        <TableRow style={{ whiteSpace: "nowrap" }}>
                            <TableCell 
                                key={base} 
                                sx={{ 
                                    position: "sticky", 
                                    left: 0, 
                                    top: 0, 
                                    background: "white", 
                                    zIndex: 2000, 
                                    boxShadow: "2px 0px 5px rgba(0,0,0,0.1)", 
                                    padding: "16px", 
                                }}
                            >
                                {base}
                                <Button onClick={() => sort(false, base)}>↑</Button>
                                <Button onClick={() => sort(true, base)}>↓</Button>
                            </TableCell>
                            {template.map((key) => (
                                key !== base && (
                                    <TableCell 
                                        key={key} 
                                        sx={{ background: "white" }}
                                    >
                                        {key}
                                        <Button onClick={() => sort(false, key)}>↑</Button>
                                        <Button onClick={() => sort(true, key)}>↓</Button>
                                    </TableCell>
                                )
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody sx={{ position: "relative" }}>
                        {list.map((element) => (
                            <TableRow key={element[base]} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell 
                                    key={element[base] + base} 
                                    sx={{ 
                                        position: "sticky", 
                                        left: 0, 
                                        background: "white", 
                                        zIndex: 1000,
                                        boxShadow: "2px 0px 5px rgba(0,0,0,0.1)" 
                                    }}
                                >
                                    {element[base]}
                                </TableCell>
                                {template.map((field) => (
                                    field !== base && (
                                        <TableCell key={element[base] + field}>
                                            {!Number.isNaN(parseFloat(element[field])) && JSON.stringify(element[field]).includes(".") 
                                                ? parseFloat(element[field]).toFixed(3) 
                                                : JSON.stringify(element[field])
                                            }
                                        </TableCell>
                                    )
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </ThemeProvider>
    );
};

export default RegionalTable;
