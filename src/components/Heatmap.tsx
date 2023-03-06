import { Box, Center, Flex, Grid, Spacer, Stack, Text, Tooltip } from "@chakra-ui/react";
import React, { FC, useEffect, useState } from 'react';


interface HeatmapProps{
    matches: any[];
    fields: string[];
    columns: number;
    rows: number;
}

const HeatMap: FC<HeatmapProps> = ({ matches, fields , columns, rows}) => {
    interface HeatMapData{
        name: string; 
        count: number; 
        fill: string; 
        textfill: string;
    }
    const colors : any = ["#edf8e9", "#c7e9c0", "#a1d99b", "#74c476", "#31a354", "#006d2c"];
    const textcolors : any = ["#0010d9", "#5b5ea6", "#3956df", "#5b6da6", "#bbccdd", "#dfdfff"]
    //Collect/preprocess data
    let data: any[] = [];
    fields.forEach((n)=>{
        data.push({name: n, count: 0, fill: '', textfill: ''});
    })
    matches.forEach((match) => {
        data.forEach((d:HeatMapData) =>{
            d.count+=match[d.name];
        })
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
            //kind of arbitrary
            const dimensions = [55,61,105,115,120] //60 doesn't work so 61 
            const fontsizes = [10,11,15,16,18]
            const margins = [1,1,1,1.5,2]
            const padding = [0.5,1.5,2,2.5,3]
            return (
            <Box 
            borderRadius = 'md' 
            textAlign ='center' 
            padding = {padding}
            margin = {margins}
            w={dimensions} 
            h={dimensions}
            bg={element["fill"]} 
            color = {element['textfill']} 
            opacity = {10*Math.max(element.count,0.5)/max_count}>
                <Text fontSize={fontsizes}>
                    {element.name+": "}
                    {element.count}
                </Text>
            </Box>
            )};
        //heatmap
        return(
            <Grid templateRows={`repeat(${rows}, 1fr)`} templateColumns={`repeat(${columns}, 1fr)`} >
                {data.map((e)=>rendbox(e))}
            </Grid>
        );
};

//exporting HeatMap as component
export default HeatMap;