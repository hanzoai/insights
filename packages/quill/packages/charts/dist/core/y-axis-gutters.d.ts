import { ChartScales } from './types';
/** One stacked value-axis gutter. `offset` is its outward pixel distance from the plot edge; the
 *  next gutter out clears this one's `width` + {@link GUTTER_GAP}, plus a title band when titled. */
export interface Gutter {
    axisId: string;
    key: string;
    side: 'left' | 'right';
    offset: number;
    width: number;
    title?: string;
    ticks: number[];
    scale: (value: number) => number;
    formatter: (value: number) => string;
}
export interface YAxisGutterOptions {
    /** `scales.yTicks()` — used for the single-axis path. */
    yTicks: number[];
    yTickFormatter?: (value: number) => string;
    /** Like `yTickFormatter` but only the multi-axis path consults it; the single-axis path already
     *  resolves the user formatter into `yTickFormatter`. */
    userYTickFormatter?: (value: number) => string;
    yAxisFormatters?: Record<string, (value: number) => string>;
    titles?: Record<string, string>;
    /** Axis ids to skip entirely — no ticks, no title, no gutter step. Multi-axis path only. */
    hiddenAxes?: Record<string, boolean>;
}
/** Gap from the plot edge to a gutter's tick labels — shared by AxisLabels and AxisTitles. */
export declare const TICK_GAP = 8;
/** Resolve the stacked value-axis gutters, outermost-last per side — one per axis when `scales.yAxes`
 *  is present (`showMultipleYAxes`), else a single left gutter. Shared by `AxisLabels` (ticks) and
 *  `AxisTitles` (titles) so the two can't drift. */
export declare function computeYAxisGutters(scales: ChartScales, { yTicks, yTickFormatter, userYTickFormatter, yAxisFormatters, titles, hiddenAxes }: YAxisGutterOptions): Gutter[];
