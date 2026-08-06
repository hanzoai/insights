import { default as React } from 'react';
import { BarChartConfig, ChartTheme, DateRangeZoomData, PointClickData, Series, TooltipContext } from '../../core/types';
export interface BarChartProps<Meta = unknown> {
    series: Series<Meta>[];
    labels: string[];
    config?: BarChartConfig;
    theme: ChartTheme;
    tooltip?: (ctx: TooltipContext<Meta>) => React.ReactNode;
    onPointClick?: (data: PointClickData<Meta>) => void;
    /** Enables x-axis drag-to-zoom. Vertical bars only — horizontal bars interact along y,
     *  where the gesture is disabled by the core. See `ChartProps.onDateRangeZoom`. */
    onDateRangeZoom?: (data: DateRangeZoomData) => void;
    className?: string;
    /** `data-attr` applied to the chart wrapper. See `ChartProps.dataAttr`. */
    dataAttr?: string;
    children?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}
export declare function BarChart<Meta = unknown>({ onError, ...rest }: BarChartProps<Meta>): React.ReactElement;
