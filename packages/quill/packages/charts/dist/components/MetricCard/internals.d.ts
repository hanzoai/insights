import { default as React } from 'react';
export interface ChangeColor {
    background: string;
    foreground: string;
}
export declare const DEFAULT_POSITIVE_COLOR: ChangeColor;
export declare const DEFAULT_NEGATIVE_COLOR: ChangeColor;
export declare const DEFAULT_FORMAT_VALUE: (v: number) => string;
export declare const DEFAULT_FORMAT_CHANGE: (p: number) => string;
export declare function changeFromPreviousPoint(data: number[], index: number): number | null;
export declare function computeFallbackChangePercent(sparklineData: number[] | null, usePrevPointHover: boolean, intentIndex: number, liveValue: number, baselineValue: number | undefined): number | null;
export interface ChangePillProps {
    positive: boolean;
    label: React.ReactNode;
    colors: ChangeColor;
    size?: 'sm' | 'md';
    tooltip?: string;
}
export declare function ChangePill({ positive, label, colors, size, tooltip }: ChangePillProps): React.ReactElement;
