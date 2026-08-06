import { default as React } from 'react';
import { AxisLinesConfig, ChartLegendConfig, ChartTheme, DateRangeZoomData, PointClickData, Series, TooltipConfig, TooltipContext } from '../../core/types';
import { GoalLineConfig } from '../../utils/goal-lines';
import { XAxisConfig, YAxisConfig } from '../../utils/use-axis-formatters';
import { ConfidenceIntervalConfig, MovingAverageConfig, TrendLineConfig } from '../utils/use-derived-series';
import { ValueLabelsConfig } from '../utils/use-value-labels';
export type { ConfidenceIntervalConfig, MovingAverageConfig, TrendLineConfig };
export interface TimeSeriesLineChartConfig {
    xAxis?: XAxisConfig;
    /** Single object = one y-axis (today's behavior). Array = one entry per axis for dual y-axis
     *  charts: set `id` (matches `Series.yAxisId`; first entry defaults to `'left'`) and `position`
     *  (`'left'`/`'right'`; first entry defaults to `'left'`, the rest to `'right'`). A series renders
     *  against a secondary axis when its `yAxisId` matches an entry's `id`. */
    yAxis?: YAxisConfig | YAxisConfig[];
    valueLabels?: boolean | ValueLabelsConfig;
    goalLines?: GoalLineConfig[];
    confidenceIntervals?: ConfidenceIntervalConfig[];
    movingAverage?: MovingAverageConfig[];
    trendLines?: TrendLineConfig[];
    /** Comparison series keys mapped to their primary. Comparison series render dimmed. */
    comparisonOf?: Record<string, string>;
    /** Render area-fill series as a 100% stacked view; y-axis becomes 0–100%. */
    percentStackView?: boolean;
    /** Show a vertical crosshair line that follows the cursor. */
    showCrosshair?: boolean;
    /** Horizontal grid lines, aligned to the primary y-axis ticks. `showGrid` on the primary
     *  `yAxis` config, when set, wins. */
    showGrid?: boolean;
    /** Draw L-shaped axis baselines without grid lines (ignored when `yAxis.showGrid` is true). */
    showAxisLines?: AxisLinesConfig;
    /** Draw short tick marks next to each visible axis label. Pairs with `showAxisLines`. */
    showTickMarks?: boolean;
    /** Line interpolation: `linear` (default) or `monotone` (smooth curve through every point). */
    curve?: 'linear' | 'monotone';
    /** Tooltip behaviour (pinning, placement). Tooltip *content* is the `tooltip` render prop. */
    tooltip?: TooltipConfig;
    /** Built-in legend with click-to-toggle series visibility. Hidden by default. */
    legend?: ChartLegendConfig;
}
export interface TimeSeriesLineChartProps<Meta = unknown> {
    series: Series<Meta>[];
    labels: string[];
    theme: ChartTheme;
    config?: TimeSeriesLineChartConfig;
    tooltip?: (ctx: TooltipContext<Meta>) => React.ReactNode;
    onPointClick?: (data: PointClickData<Meta>) => void;
    onDateRangeZoom?: (data: DateRangeZoomData) => void;
    dataAttr?: string;
    className?: string;
    children?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}
export declare function TimeSeriesLineChart<Meta = unknown>({ series, labels, theme, config, tooltip, onPointClick, onDateRangeZoom, dataAttr, className, children, onError, }: TimeSeriesLineChartProps<Meta>): React.ReactElement;
