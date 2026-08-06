import { default as React } from 'react';
export interface AxisTitlesProps {
    xAxisLabel?: string;
    /** Category-axis title for horizontal charts only; vertical titles come per-gutter. */
    yAxisLabel?: string;
    hideXAxis?: boolean;
    hideYAxis?: boolean;
    orientation?: 'vertical' | 'horizontal';
    axisColor: string;
}
export declare function AxisTitles({ xAxisLabel, yAxisLabel, hideXAxis, hideYAxis, orientation, axisColor, }: AxisTitlesProps): React.ReactElement | null;
