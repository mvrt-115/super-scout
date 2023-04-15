import {
    Box,
    Center,
    Flex,
    Grid,
    Spacer,
    Stack,
    Text,
    Tooltip,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';

interface HeatmapProps {
    data: any;
    fields: string[];
    columns: number;
    rows: number;
    r: string;
    g: string;
    b: string;
}

const HeatMap: FC<HeatmapProps> = ({
    data,
    fields,
    columns,
    rows,
    r,
    g,
    b,
}) => {
    interface HeatMapData {
        name: string;
        count: number;
        fill: string;
        textfill: string;
    }
    const colors: any = [
        '#edf8e9',
        '#c7e9c0',
        '#a1d99b',
        '#74c476',
        '#31a354',
        '#006d2c',
    ];
    const textcolors: any = [
        '#0a0a0a',
        '#0a0a0a',
        '#0a0a0a',
        '#0a0a0a',
        '#0a0a0a',
        '#f7f7f7',
    ];
    //Collect/preprocess data
    let renderData: any[] = [];
    fields.forEach((n: string) => {
        renderData.push({ name: n, count: data[n], fill: '', textfill: '' });
    });

    
    //heatmap boxes
    const rendbox = (element: HeatMapData) => {
        //kind of arbitrary
        // const dimensions = [55, 61, 105, 115, 120]; //60 doesn't work so 61
        // const fontsizes = [10, 11, 15, 16, 18];
        // const margins = [1, 1, 1, 1.5, 2];
        // const padding = [0.5, 1.5, 2, 2.5, 3];
        return (
            <Box
                borderRadius="10%"
                textAlign="center"
                padding={'1rem'}
                margin=".25rem"
                bg={`rgba(${r}, ${g}, ${b}, ${(element.count + 1) / 9})`}
                color={element.count > 5 ? '#f7f7f7' : '#0a0a0a'}
            >
                <Text>
                    {element.name.substring(6) + ': '}
                    {Math.round(element.count * 100) / 100}
                </Text>
            </Box>
        );
    };
    //heatmap
    return (
        <Grid
            templateRows={`repeat(${rows}, 1fr)`}
            templateColumns={`repeat(${columns}, 1fr)`}
        >
            {renderData.map((e: any) => rendbox(e))}
        </Grid>
    );
};

//exporting HeatMap as component
export default HeatMap;
