import React, { FC } from 'react';
import { Pie, PieChart, Tooltip as REToolTip } from 'recharts';

interface ClimbPieChartProps {
    matches: any[];
}

const ClimbPieChart: FC<ClimbPieChartProps> = ({matches}) => {
    const data = [
        // { name: 'Low', count: 0, fill: '#260235' },
        // { name: 'Mid', count: 0, fill: '#550575' },
        // { name: 'High', count: 0, fill: '#dab0ec' },
        // { name: 'Traversal', count: 0, fill: '#ffc410' },
        { name: 'Shallow Success', count: 0, fill: '#dab0ec' },
        { name: 'Shallow Failed', count: 0, fill: '#dab0ec' },
        { name: 'Deep Success', count: 0, fill: '#ffc410' },
        { name: 'Deep Failed', count: 0, fill: '#ffc410' },
        { name: 'None', count: 0, fill: '#202020' },
    ];
    matches.forEach((match) => {
        switch (match['Climb rung']) {
            // case 'Low':
            //     data[0]['count'] += 1;
            //     break;
            // case 'Mid':
            //     data[1]['count'] += 1;
            //     break;
            // case 'High':
            //     data[2]['count'] += 1;
            //     break;
            // case 'Traversal':
            //     data[3]['count'] += 1;
            //     break;
            // case 'None':
            //     data[4]['count'] += 1;
            //     break;
            case 'Shallow Success':
                data[0]['count'] += 1;
                break;
            case 'Shallow Failed':
                data[1]['count'] += 1;
                break;
            case 'Deep Success':
                data[2]['count'] += 1;
                break;
            case 'Deep Failed':
                data[3]['count'] += 1;
                break;
            case 'None':
                data[4]['count'] += 1;
                break;
        }
    });

    return (
        <PieChart width={400} height={400}>
            <Pie
                dataKey={'count'}
                isAnimationActive={false}
                data={data}
                cx={200}
                cy={200}
                innerRadius={100}
                outerRadius={150}
                label
                paddingAngle={2}
            />
            <REToolTip />
        </PieChart>
    );
}
export default ClimbPieChart;