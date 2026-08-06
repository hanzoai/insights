import { default as React } from 'react';
import { ChartTheme, DateRangeZoomData, LineChartConfig, PointClickData, Series, TooltipContext } from '../../core/types';
export interface LineChartProps<Meta = unknown> {
    series: Series<Meta>[];
    labels: string[];
    config?: LineChartConfig;
    theme: ChartTheme;
    tooltip?: (ctx: TooltipContext<Meta>) => React.ReactNode;
    onPointClick?: (data: PointClickData<Meta>) => void;
    onDateRangeZoom?: (data: DateRangeZoomData) => void;
    className?: string;
    /** `data-attr` applied to the chart wrapper. See `ChartProps.dataAttr`. */
    dataAttr?: string;
    children?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}
export declare function LineChart<Meta = unknown>({ onError, ...rest }: LineChartProps<Meta>): React.ReactElement;
