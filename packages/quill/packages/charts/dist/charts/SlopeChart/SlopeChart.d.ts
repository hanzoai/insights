import { default as React } from 'react';
import { ChartConfig, ChartLegendConfig, ChartTheme, PointClickData, Series, TooltipContext, ValueDomain } from '../../core/types';
import { SlopeSeriesMeta } from './slope-data';
export type { SlopeSeriesMeta } from './slope-data';
/** Slope-chart legend config. Same shape as every chart's {@link ChartLegendConfig} — clicking a
 *  row toggles that series (interactive by default). Rows carry the per-series change. */
export type SlopeChartLegendConfig = ChartLegendConfig;
export interface SlopeChartConfig extends ChartConfig {
    /** Show the series name labels beside each series' last point. Default true. */
    showSeriesLabels?: boolean;
    /** Default for the start (left) value labels; per-series `meta.showStartLabel` overrides. Default true. */
    showStartLabels?: boolean;
    /** Default for the end (right) value labels; per-series `meta.showEndLabel` overrides. Default true. */
    showEndLabels?: boolean;
    /** Legend visibility + placement. Hidden by default. */
    legend?: SlopeChartLegendConfig;
    /** Formats the start/end value labels. Defaults to `toLocaleString`. */
    valueFormatter?: (value: number) => string;
    /** Formats the per-series change shown in the legend. Defaults to a signed `toLocaleString`. */
    deltaFormatter?: (delta: number) => string;
    /** Radius of the point markers in px. Default 4. */
    pointRadius?: number;
    /** Value-axis domain control — omit for data-derived auto-scaling. */
    valueDomain?: ValueDomain;
}
export interface SlopeChartProps<Meta = SlopeSeriesMeta> {
    series: Series<Meta>[];
    labels: string[];
    config?: SlopeChartConfig;
    theme: ChartTheme;
    tooltip?: (ctx: TooltipContext<Meta>) => React.ReactNode;
    onPointClick?: (data: PointClickData<Meta>) => void;
    className?: string;
    /** `data-attr` applied to the chart wrapper. See `ChartProps.dataAttr`. */
    dataAttr?: string;
    children?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}
export declare function SlopeChart<Meta = SlopeSeriesMeta>({ onError, ...rest }: SlopeChartProps<Meta>): React.ReactElement;
