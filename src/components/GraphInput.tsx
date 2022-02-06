import { DeleteIcon } from '@chakra-ui/icons';
import { HStack, IconButton, Select, Text } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';

interface GraphInputProps {
    graphData?: GraphData;
    onChange: (graphData: GraphData) => void;
    onDelete: () => void;
    keys: string[];
}
const GraphInput: FC<GraphInputProps> = ({
    graphData,
    onChange,
    keys,
    onDelete,
}) => {
    const [xAxis, setXAxis] = useState<string>(
        graphData?.x ||
            keys[
                keys.indexOf('matchNum') === -1
                    ? keys.indexOf('teamNum') || 0
                    : keys.indexOf('matchNum')
            ],
    );
    const [yAxis1, setYAxis1] = useState<string>(graphData?.y[0] || keys[1]);
    const [yAxis2, setYAxis2] = useState<string>(graphData?.y[1] || 'none');
    const [yAxis3, setYAxis3] = useState<string>(graphData?.y[2] || 'none');
    const [sortBy, setSortBy] = useState<string>(graphData?.sortBy || 'ccwm');
    const [type, setType] = useState<
        'Bar' | 'Area' | 'Line' | 'Scatter' | 'Pie'
    >('Bar');

    useEffect(() => {
        onChange({
            x: xAxis,
            y: [yAxis1, yAxis2, yAxis3],
            type: type,
            sortBy: sortBy
        });
    }, [xAxis, yAxis1, yAxis2, yAxis3, type, sortBy]);

    return (
        <HStack alignItems="center" justifyContent="center" width={'100%'}>
            <Text>X-Axis:</Text>
            <Select
                width={'fit-content'}
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
            >
                {keys.map((key) => (
                    <option key={key} value={key}>
                        {key}
                    </option>
                ))}
            </Select>
            <Text>Y-Axis:</Text>
            <Select
                width={'fit-content'}
                value={yAxis1}
                onChange={(e) => setYAxis1(e.target.value)}
            >
                {keys.map((key) => (
                    <option key={key} value={key}>
                        {key}
                    </option>
                ))}
            </Select>
            <Select
                width={'fit-content'}
                value={yAxis2}
                onChange={(e) => setYAxis2(e.target.value)}
            >
                <option value="none">None</option>
                {keys.map((key) => (
                    <option key={key} value={key}>
                        {key}
                    </option>
                ))}
            </Select>
            <Select
                width={'fit-content'}
                value={yAxis3}
                onChange={(e) => setYAxis3(e.target.value)}
            >
                <option value="none">None</option>
                {keys.map((key) => (
                    <option key={key} value={key}>
                        {key}
                    </option>
                ))}
            </Select>
            <Text>Sort By:</Text>
            <Select
                width={'fit-content'}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
            >
                <option value="none">None</option>
                {keys.map((key) => (
                    <option key={key} value={key}>
                        {key}
                    </option>
                ))}
            </Select>
            <Text>Graph Type:</Text>
            <Select
                onChange={(e) => {
                    const val: any = e.target.value;
                    setType(val);
                }}
                width={'fit-content'}
            >
                <option value="Bar">Bar</option>
                <option value="Area">Area</option>
                <option value="Line">Line</option>
                <option value="Scatter">Scatter</option>
            </Select>
            <IconButton
                aria-label="delete"
                icon={<DeleteIcon />}
                onClick={onDelete}
                colorScheme={'red'}
            />
        </HStack>
    );
};

export default GraphInput;
