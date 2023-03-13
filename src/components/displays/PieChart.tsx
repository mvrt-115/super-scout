import React, { FC, useEffect, useState } from 'react';
import { Pie, PieChart, Tooltip as REToolTip } from 'recharts';

interface GenericPieChartProps {
    colors?: any; // pass in an object with the formatting: {name1 : color, name2 : color, ...}
    // color is a number in 1, 100, 200, 300, ... 1000
    // Alternatively pass in an empty object and it will automatically assign colors
    radius?: number;
    height?: number;
    width?: number;
}
interface valuesArray extends GenericPieChartProps {
    valueArray: any[]; // pass in an array of values ['Mid', 'Mid', 'High' ...]
    valueObject?: never;
}

interface valuesObject extends GenericPieChartProps {
    valueObject: any; // pass in an array with the ammounts {"Mid" : 10, "High" : 3 ...}
    valueArray?: never;
}

// for example if you wanted to use last years matches to generate a pie chart of the different climbs
// from the 2022 game, you could call the following:
// <GenericPieChart values={matches.map((match) => match['Climb rung'])} colors = {{'Low' : '1000', 'Mid' : '500', 'High' : '200', 'Traversal' : '1', 'None' : '1000'}}/>
// Alternatively leaving colors blank or passing in an empty array will automatically assign the colors
const GenericPieChart: FC<valuesArray | valuesObject> = ({
    valueArray,
    valueObject,
    colors,
    radius,
    height,
    width,
}) => {
    const colorValues = [
        '#ffc410',
        '#9969ac',
        '#88509e',
        '#773791',
        '#661e83',
        '#550575',
        '#4b0f6d',
        '#3e0a5f',
        '#2f064b',
        '#1f0136',
        '#260235',
    ];

    const colorReference = [
        '1',
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800',
        '900',
        '1000',
    ];

    const [data, setData] = useState<any>([]);

    const findName = (name: any) => {
        for (let i = 0; i < data.length; i++) {
            if (data[i]['name'] == name) return i;
        }
        return -1;
    };

    const getColor = (name: any) => {
        if (colors == undefined || colors[name] == undefined) {
            return colorValues.shift();
        }
        return colorValues[colorReference.indexOf(colors[name])];
    };

    if (valueArray != undefined) {
        valueArray.forEach((value) => {
            let i = findName(value);
            if (i === -1) {
                data.push({ name: value, count: 1, fill: getColor(value) });
            } else {
                data[i]['count'] += 1;
            }
        });
    } else {
        Object.keys(valueObject).forEach((key) => {
            data.push({
                name: key,
                count: valueObject[key],
                fill: getColor(key),
            });
        });
    }
    console.log(data);

    return (
        <PieChart width={width || 400} height={height || 400}>
            <Pie
                dataKey={'count'}
                isAnimationActive={false}
                data={data}
                cx={width ? width / 2 : 200}
                cy={height ? height / 2 : 200}
                innerRadius={radius ? radius - 50 : 100}
                outerRadius={radius || 150}
                label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    value,
                    index,
                }) => {
                    if (data[index].count <= 0) return <></>;
                    const RADIAN = Math.PI / 180;
                    // eslint-disable-next-line
                    const radius =
                        25 + innerRadius + (outerRadius - innerRadius);
                    // eslint-disable-next-line
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    // eslint-disable-next-line
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                        <text
                            x={x}
                            y={y}
                            fill="#8884d8"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                        >
                            {data[index].name} ({value})
                        </text>
                    );
                }}
                paddingAngle={2}
            />
            <REToolTip />
        </PieChart>
    );
};
export default GenericPieChart;
