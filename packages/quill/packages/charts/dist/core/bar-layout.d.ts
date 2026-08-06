import { BarRect, BarRoundedCorners } from './canvas-renderer';
import { BarScaleSet, StackedBand } from './scales';
import { ResolvedSeries, Series } from './types';
/** Brand for the BarChart `ChartScales._private` slot — populated by BarChart and
 *  narrowed by its draw callbacks. */
export interface BarChartPrivate {
    __barChart: BarScaleSet;
}
export type SeriesBarLayout = (BarRect | null)[];
/** Cap is the side away from the value-axis baseline; pass `shouldRoundCap: false` for stacked
 *  layers below the topmost. `shouldRoundBaseline` rounds the side *towards* the baseline — used
 *  for the bottom-of-stack layer so a funnel-style bar reads as one rounded pill on both ends. */
export declare function cornersFor(isHorizontal: boolean, isPositive: boolean, shouldRoundCap: boolean, shouldRoundBaseline?: boolean): BarRoundedCorners;
/** Re-resolve stacked cap rounding per band, geometrically, from the laid-out rects: within each
 *  `dataIndex`, only the segment reaching furthest away from the baseline in each direction keeps
 *  a rounded cap — everything else's cap is squared. Decided after layout so breakdown stacks
 *  (whose top layer varies band to band) and diverging stacks (negative bottoms) round the actual
 *  outer segment, not the last series in stack order. Mutates `corners` in place; baseline
 *  corners are untouched. */
export declare function roundOuterStackCaps(bars: BarRect[], isHorizontal: boolean, baselinePx: number): void;
/** A laid-out bar paired with the axis its series scales against (`Series.yAxisId`). */
export interface AxisBarEntry {
    bar: BarRect;
    yAxisId?: string;
}
/** The shared cap-rounding pass over laid-out bars: groups them by value axis and runs
 *  {@link roundOuterStackCaps} per group against that axis's own zero pixel — a secondary-axis
 *  stack (ComboChart) must not be judged against the primary baseline. Owns the layout guard:
 *  no-op for grouped layouts (caps are per-bar) and under `roundStackEnds` (the pill clip owns
 *  the corners), so static, hover, and cursor paths can't diverge on when the pass applies. */
export declare function applyOuterStackCaps(entries: readonly AxisBarEntry[], scales: BarScaleSet, isHorizontal: boolean, layout: 'stacked' | 'grouped' | 'percent', roundStackEnds?: boolean): void;
export interface ComputeSeriesBarsOptions {
    series: Series;
    labels: string[];
    scales: BarScaleSet;
    layout: 'stacked' | 'grouped' | 'percent';
    isHorizontal: boolean;
    /** Required for `stacked` and `percent` layouts. Must be omitted for `grouped`. */
    stackedBand?: StackedBand;
    isTopOfStack: boolean;
    /** Per-index override for cap rounding — funnels round whichever segment is the topmost
     *  *non-zero* one at each band, which varies by band (e.g. a 100% first step has no
     *  filler). When omitted, falls back to the per-series `isTopOfStack`. */
    capRoundedAtIndex?: (dataIndex: number) => boolean;
    /** Per-index override for baseline rounding — rounds the side towards the value-axis
     *  baseline for the bottom-of-stack segment. When omitted, the baseline is never rounded. */
    baseRoundedAtIndex?: (dataIndex: number) => boolean;
}
export declare function computeSeriesBars({ series, labels, scales, layout, isHorizontal, stackedBand, isTopOfStack, capRoundedAtIndex, baseRoundedAtIndex, }: ComputeSeriesBarsOptions): SeriesBarLayout;
/** One drawn series and its computed rects — the unit both BarChart and ComboChart iterate. */
export interface BarLayer {
    series: ResolvedSeries;
    bars: BarRect[];
}
export interface BuildBarLayersOptions {
    series: readonly ResolvedSeries[];
    labels: string[];
    scales: BarScaleSet;
    layout: 'stacked' | 'grouped' | 'percent';
    isHorizontal: boolean;
    stackedData?: Map<string, StackedBand>;
    topStackedKeyByAxis: Map<string, string>;
}
/** Compute the bar rects for every visible series — the per-series `computeSeriesBars` loop shared by
 *  `drawBarChartStatic` and ComboChart so the band/axis/stack wiring lives in one place. Excluded
 *  series are dropped; nulls (overlay/CI-band series with no stacked entry) are filtered out. */
export declare function buildBarLayers({ series, labels, scales, layout, isHorizontal, stackedData, topStackedKeyByAxis, }: BuildBarLayersOptions): BarLayer[];
export interface ComputeBarAtIndexOptions {
    series: Series;
    label: string;
    dataIndex: number;
    scales: BarScaleSet;
    layout: 'stacked' | 'grouped' | 'percent';
    isHorizontal: boolean;
    /** Required for `stacked` and `percent` layouts. Must be omitted for `grouped`. */
    stackedBand?: StackedBand;
    isTopOfStack: boolean;
    /** Resolved cap-rounding for this bar. Overrides the `isGrouped || isTopOfStack` default. */
    capRounded?: boolean;
    /** Resolved baseline-rounding for this bar. Defaults to `false`. */
    baseRounded?: boolean;
}
/** Single-bar fast path for `drawHover` so the overlay redraw doesn't recompute every bar
 *  on every mousemove. Returns `null` for indices with no renderable bar. */
export declare function computeBarAtIndex({ series, label, dataIndex, scales, layout, isHorizontal, stackedBand, isTopOfStack, capRounded, baseRounded, }: ComputeBarAtIndexOptions): BarRect | null;
/** The track rect behind a bar — the bar's band slot stretched across the whole value
 *  axis. `axisRangeA`/`axisRangeB` are the two endpoints of the value scale's pixel range
 *  (in either order — for a vertical Y scale d3 returns `[bottomPx, topPx]`). Used by
 *  funnel-style charts to draw and hit-test the faint "remainder to 100%" region. */
export declare function computeBarTrackRect(bar: BarRect, axisRangeA: number, axisRangeB: number, isHorizontal: boolean): BarRect;
/** Pixel center of a band along the band axis — the anchor for band-level tooltips and grid ticks. */
export declare function bandCenter(scales: BarScaleSet, label: string): number | undefined;
/** Center of a specific series's bar within a band. Used by overlays (e.g. annotations)
 *  to anchor on the current-period bar in compare-against-previous grouped layouts.
 *  Returns undefined when the layout isn't grouped or the series isn't in the group scale. */
export declare function groupedBarCenter(scales: BarScaleSet, label: string, seriesKey: string): number | undefined;
