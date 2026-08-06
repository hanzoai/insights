import { default as React } from 'react';
import { ChartTheme, ComboChartConfig, PointClickData, Series, TooltipContext } from '../../core/types';
export interface ComboChartProps<Meta = unknown> {
    series: Series<Meta>[];
    labels: string[];
    config?: ComboChartConfig;
    theme: ChartTheme;
    tooltip?: (ctx: TooltipContext<Meta>) => React.ReactNode;
    onPointClick?: (data: PointClickData<Meta>) => void;
    className?: string;
    /** `data-attr` applied to the chart wrapper. See `ChartProps.dataAttr`. */
    dataAttr?: string;
    children?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}
export declare function ComboChart<Meta = unknown>({ onError, ...rest }: ComboChartProps<Meta>): React.ReactElement;
