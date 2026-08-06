import { default as React } from 'react';
import { AxisLinesConfig, BarChartConfig, BarFillStyle, ChartLegendConfig, ChartMargins, ChartTheme, DateRangeZoomData, PointClickData, Series, TooltipConfig, TooltipContext } from '../../core/types';
import { GoalLineConfig } from '../../utils/goal-lines';
import { XAxisConfig, YAxisConfig } from '../../utils/use-axis-formatters';
import { TrendLineConfig } from '../utils/use-derived-series';
import { ValueLabelsConfig } from '../utils/use-value-labels';
export interface TimeSeriesBarChartConfig {
    xAxis?: XAxisConfig;
    /** Single object for a standard left axis; array for dual left+right axes (pass `id` and `position` on each). */
    yAxis?: YAxisConfig | YAxisConfig[];
    valueLabels?: boolean | ValueLabelsConfig;
    goalLines?: GoalLineConfig[];
    /** Defaults to `stacked`. */
    barLayout?: BarChartConfig['barLayout'];
    /** Defaults to `vertical`. */
    axisOrientation?: BarChartConfig['axisOrientation'];
    /** Stacked bars only round the topmost segment. */
    barCornerRadius?: number;
    /** Show a vertical crosshair line that follows the cursor. */
    showCrosshair?: boolean;
    /** Horizontal grid lines, aligned to the primary y-axis ticks. `showGrid` on the primary
     *  `yAxis` config, when set, wins. */
    showGrid?: boolean;
    /** Draw L-shaped axis baselines without grid lines (ignored when `yAxis.showGrid` is true). */
    showAxisLines?: AxisLinesConfig;
    /** Draw short tick marks next to each visible axis label. Pairs with `showAxisLines`. */
    showTickMarks?: boolean;
    /** Tooltip behaviour (pinning, placement). Tooltip *content* is the `tooltip` render prop. */
    tooltip?: TooltipConfig;
    /** Stacked layout only — stack negatives below the zero baseline (d3.stackOffsetDiverging). */
    divergingStack?: boolean;
    /** Bar fill treatment — `flat` (default), `gradient`, or `gloss`. */
    fillStyle?: BarFillStyle;
    /** Inner gap between bars as a fraction of the band slot (0–1). See {@link BarsConfig.bandPadding}. */
    bandPadding?: number;
    /** Px floor on a bar's thickness along the value axis, so a tiny non-zero value stays visible.
     *  See {@link BarsConfig.minBarSize}. */
    minBarSize?: number;
    /** Per-side overrides on the computed chart margins — see {@link ChartConfig.margins}. */
    margins?: Partial<ChartMargins>;
    /** Ease the hover highlight in over this many ms (`true` = default duration). Omit to snap. */
    animateHover?: boolean | number;
    /** Built-in legend with click-to-toggle series visibility. Hidden by default. */
    legend?: ChartLegendConfig;
    /** Linear or exponential trend line overlays — rendered as SVG lines on top of the bars. */
    trendLines?: TrendLineConfig[];
}
export interface TimeSeriesBarChartProps<Meta = unknown> {
    series: Series<Meta>[];
    labels: string[];
    theme: ChartTheme;
    config?: TimeSeriesBarChartConfig;
    tooltip?: (ctx: TooltipContext<Meta>) => React.ReactNode;
    onPointClick?: (data: PointClickData<Meta>) => void;
    /** Enables x-axis drag-to-zoom. See `BarChartProps.onDateRangeZoom`. */
    onDateRangeZoom?: (data: DateRangeZoomData) => void;
    dataAttr?: string;
    className?: string;
    children?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}
export declare function TimeSeriesBarChart<Meta = unknown>({ series, labels, theme, config, tooltip, onPointClick, onDateRangeZoom, dataAttr, className, children, onError, }: TimeSeriesBarChartProps<Meta>): React.ReactElement;
