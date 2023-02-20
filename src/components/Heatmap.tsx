import { Box, Center, Flex, Grid, Spacer, Stack, Text, Tooltip } from "@chakra-ui/react";
import React, { FC, useEffect, useState } from 'react';


interface HeatmapProps{
    matches: any[];
    fields: string[];
}

const HeatMap: FC<HeatmapProps> = ({ matches, fields }) => {
    interface HeatMapData{
        name: string; 
        count: number; 
        fill: string; 
        textfill: string;
    }
    const colors : any = ["#edf8e9", "#a1d99b", "#7dd489", "#74c476", "#31a354", "#006d2c"]
    const textcolors : any = ["#0010d9", "#5b5ea6", "#3956df", "#5b6da6", "#bbccdd", "#dfdfff"]
    //Collect/preprocess data
    let data: any[] = [];
    fields.forEach((n)=>{
        data.push({name: n, count: 0, fill: '', textfill: ''});
    })
    matches.forEach((match) => {
        data.forEach((d:HeatMapData) =>{
            d.count+=match[d.name]+match[d.name];
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
            return (
            <Box borderRadius = 'md' textAlign ='center' padding = '5px' w='120px' h='120px' bg={element["fill"]} color = {element['textfill']} opacity = {10*Math.max(element.count,1)/max_count}>
                    {element.name+": "}
                    {element.count.toString()}
            </Box>
            )};
        //heatmap
        return(
            <Grid templateRows='repeat(2, 1fr)' templateColumns='repeat(5, 1fr)'gap = '10px'>
                {data.map((e)=>rendbox(e))}
            </Grid>
        );
};

//exporting HeatMap as component
export default HeatMap;