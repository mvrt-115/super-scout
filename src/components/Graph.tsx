import React, { FC, useEffect, useState } from 'react';
import {
    Area,
    Bar,
    CartesianGrid,
    Line,
    ResponsiveContainer,
    Scatter,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ComposedChart } from 'recharts';

interface GraphProps {
    graphInfo: GraphData;
    data: any[];
}

const Graph: FC<GraphProps> = ({ graphInfo, data }) => {
    const [graphingData, setGraphingData] = useState<any[]>([]);
    const colors = ['#260245', '#ffc410', '#dab0ec', '#550575'];

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

        setGraphingData(graphingData);
    }, [graphInfo, data]);
    return (
        <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={graphingData}>
                <CartesianGrid stroke="#f5f5f5" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                {graphInfo.y.map((data, index) => {
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
                    else if (graphInfo.type === 'Scatter')
                        return <Scatter {...props} />;
                })}
            </ComposedChart>
        </ResponsiveContainer>
    );
};

export default Graph;
