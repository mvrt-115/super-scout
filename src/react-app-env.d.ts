/// <reference types="react-scripts" />
declare module 'qrscan';
declare interface GraphData {
    x: string;
    y: [string, string, string];
    type: 'Bar' | 'Area' | 'Line' | 'Scatter' | 'Pie';
}
