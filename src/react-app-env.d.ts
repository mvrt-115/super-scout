/// <reference types="react-scripts" />
declare module 'qrscan';
declare interface GraphData {
    x: string;
    y: [string, string, string];
    sortBy: string;
    type: 'Bar' | 'Area' | 'Line' | 'Scatter' | 'Pie';
}

declare interface ScoutInputData {
    key: string;
    type: string;
    choices?: string[];
}
