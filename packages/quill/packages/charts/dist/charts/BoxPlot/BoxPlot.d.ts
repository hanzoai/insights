import { default as React } from 'react';
import { ChartConfig, ChartTheme, TooltipContext } from '../../core/types';
import { BoxPlotDatum, BoxPlotSeries } from './types';
/** Meta attached to the inner adapter `Series` we hand to the `Chart` base — carries the
 *  original six-number summaries indexed by x-position, plus any user-supplied meta. Exported
 *  so consumers with a custom `tooltip` can read the original datum back out of
 *  `entry.series.meta?.datums?.[ctx.dataIndex]`. */
export interface BoxPlotAdaptedMeta<Meta = unknown> {
    datums: (BoxPlotDatum | null)[];
    user?: Meta;
}
/** Tooltip context handed to consumer-supplied `tooltip` callbacks. Same shape as
 *  `TooltipContext` but with the `BoxPlotAdaptedMeta` `Meta` parameter baked in so consumers
 *  don't have to redeclare it. */
export type BoxPlotTooltipContext<Meta = unknown> = TooltipContext<BoxPlotAdaptedMeta<Meta>>;
/** Chart-level config. `axisOrientation` is always vertical for BoxPlot — there's no
 *  horizontal mode — so it's omitted from the consumer-visible config to avoid silently
 *  ignored values. */
export interface BoxPlotConfig extends Omit<ChartConfig, 'axisOrientation'> {
    /** Mean marker radius in CSS pixels. Defaults to 3. */
    meanRadius?: number;
    /** Whisker cap width as a fraction of the box width. Defaults to 0.6. */
    whiskerCapRatio?: number;
    /** Box outline / whisker stroke width. Defaults to 1.5. */
    boxStrokeWidth?: number;
}
export interface BoxPlotClickData<Meta = unknown> {
    /** The *first visible series* at the clicked column — matches BarChart's `onPointClick`
     *  contract. In grouped mode this is **not necessarily the series under the cursor**: when
     *  the user clicks series B's sub-band, `series` is still A. The product layer should
     *  narrow via `crossSeriesData` + the cursor x if it needs the precise box. */
    series: BoxPlotSeries<Meta>;
    /** Index of `series` in the input `series` array (first-visible, not under-cursor). */
    seriesIndex: number;
    /** Index along the x-axis (into `labels`). */
    dataIndex: number;
    /** The x-axis label at this index. */
    label: string;
    /** The six-number summary on `series` at this column. */
    datum: BoxPlotDatum;
    /** All visible boxes at this column, in render order, for cross-series comparisons. */
    crossSeriesData: {
        series: BoxPlotSeries<Meta>;
        datum: BoxPlotDatum;
    }[];
}
export interface BoxPlotProps<Meta = unknown> {
    series: BoxPlotSeries<Meta>[];
    labels: string[];
    theme: ChartTheme;
    config?: BoxPlotConfig;
    /** Optional custom tooltip. Receives the adapter `TooltipContext`; consumers can read
     *  the original datum back out via `entry.series.meta?.datums?.[ctx.dataIndex]`. */
    tooltip?: (ctx: BoxPlotTooltipContext<Meta>) => React.ReactNode;
    /** Click callback — fired when the user clicks a box. The product layer wires this to
     *  the persons modal in the BoxPlot insight. */
    onBoxClick?: (data: BoxPlotClickData<Meta>) => void;
    className?: string;
    dataAttr?: string;
    children?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}
export declare function BoxPlot<Meta = unknown>({ onError, ...rest }: BoxPlotProps<Meta>): React.ReactElement;
