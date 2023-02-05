import { Box, Center, Stack, Tooltip } from "@chakra-ui/react";
import React, { FC, useEffect, useState } from 'react';


interface HeatmapProps{
    matches: any[];
}

const HeatMap: FC<HeatmapProps> = ({ matches }) => {
    interface HeatMapData{
        name: string; 
        count: number; 
        fill: string; 
        textfill:string;
}
    //color scheme, can be any length
    const colors : any = ["#edf8e9", "#c7e9c0", "#a1d99b", "#74c476", "#31a354", "#006d2c"]
    const textcolors : any = ["#0010d9", "#1d3bef", "#3956df", "#5b6da6", "#b0c4d8", "#dfdfff"]
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
        //determine fill/colors based on count
        const max_count = Math.max(...data.map((d: HeatMapData) => d.count));
        data.forEach(
            (option: HeatMapData) => {
                for(var i=0; i<colors.length; i++){
                    if(option.count<=((1+i)/colors.length)*max_count){
                        option.fill=colors[i];
                        option.textfill=textcolors[i];
                        break;
                    }
                }
            }); 
        //heatmap boxes
        const rendbox = (element: HeatMapData) => {
            return (
            <Box borderRadius = 'md' alignItems='center' w='100px' h='100px' bg={element["fill"]} color = {element['textfill']}>
                <Center w='100px' h='100px'>
                    <Tooltip label = {element.count.toString()}>
                        {element.name}
                    </Tooltip>
                </Center>
            </Box>
            )};
        //heatmap
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

export default HeatMap;