import React, { FC, useEffect, useState } from 'react';
import {
    Area,
    Bar,
    Brush,
    CartesianGrid,
    Line,
    ResponsiveContainer,
    Scatter,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ComposedChart } from 'recharts';
import { Box } from '@chakra-ui/react'
import { useResizeDetector } from 'react-resize-detector';

interface GraphProps {
    graphInfo: GraphData;
    data: any[];
    sortBy: string;
}

const Graph: FC<GraphProps> = ({ graphInfo, data, sortBy }) => {
    const [graphingData, setGraphingData] = useState<any[]>([]);
    const colors = ['#260245', '#ffc410', '#dab0ec', '#550575'];
    //create ref of box for box sizing
    const { width, height, ref } = useResizeDetector();
    // const [ticks, setTicks] = useState<number>(5);

    useEffect(() => {
        let graphingData: any[] = [];
        data.forEach((data) => {
            const newData: any = {};
            newData['x'] = data[graphInfo.x];
            graphInfo.y.forEach((y, index) => {
                if (y !== 'none') newData[y] = data[y];
            });
            graphingData.push(newData);
        });
        sortData(graphingData);
        setGraphingData(graphingData);
    }, [sortBy, graphInfo.x, graphInfo.y, graphInfo.type]);


    const sortData = (data: any[]) => {
        if (sortBy.length < 2) return;
        data.sort((a, b) => {
            //console.log(a["teleopInner"])
            if (isNaN(a[sortBy])) a[sortBy] = -10;
            if (isNaN(a[sortBy])) b[sortBy] = -10;
            return b[sortBy] - a[sortBy];
        });
    }

    const getTickCount = () => {
        if (height) {
            if (height < 300) return 5;
            if (height < 500) return 10;
            if (height < 700) return 15;
            if (height < 900) return 20;
            if (height < 1100) return 25;
        }
        return 0;
    }

    return (
        <Box m='0' resize='both' width='100%' height='250px' overflow='auto' ref={ref}  >
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={graphingData}>
                    <CartesianGrid stroke="#f5f5f5" />
                    <XAxis dataKey="x" minTickGap={2} />
                    <YAxis tickCount={getTickCount()} />
                    <Tooltip />
                    <Brush dataKey="x" height={14} stroke="#1082a8" />
                    {graphInfo.y.map((data, index) => {
                        if (data === 'none') return null;
                        const props = {
                            dataKey: data,
                            stroke: colors[index],
                            fill: colors[index],
                            fillOpacity: 0.3,
                            key: `y${index}`,
                        };
                        if (graphInfo.type === 'Bar') return <Bar {...props} />;
                        else if (graphInfo.type === 'Line')
                            return <Line {...props} />;
                        else if (graphInfo.type === 'Area')
                            return <Area {...props} />;
                        else return <Scatter {...props} />;
                    })}
                </ComposedChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default Graph;
