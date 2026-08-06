import { ScaleBand, ScaleLinear, ScaleLogarithmic, ScalePoint } from 'd3-scale';
import { BandSlot, ChartDimensions, ResolveValueFn, Series, ValueDomain, YAxisScale } from './types';
/** Inner padding fraction applied to the band scale when `BarChartConfig.bars.bandPadding` is unset. */
export declare const DEFAULT_BAND_PADDING = 0.2;
export type D3YScale = ScaleLinear<number, number> | ScaleLogarithmic<number, number>;
export interface ScaleSet {
    x: ScalePoint<string>;
    y: D3YScale;
    /** Per-axis d3 scales keyed by axis id. Only populated when multiple axes are present. */
    yAxes?: Record<string, {
        scale: D3YScale;
        position: 'left' | 'right';
    }>;
}
export interface SeriesValueRange {
    /** Smallest finite value across all visible series, or `Infinity` if none. */
    min: number;
    /** Largest finite value across all visible series, or `-Infinity` if none. */
    max: number;
    /** Smallest strictly-positive finite value, or `Infinity` if none. Used by log scales. */
    minPositive: number;
    /** Number of finite values seen. `0` means the result is empty — `min`/`max` are sentinel. */
    count: number;
}
/**
 * Single-pass min/max over visible series, skipping excluded series and
 * non-finite values. Equivalent to `d3.min`/`d3.max` over a flatMap+filter
 * but avoids the intermediate arrays — the spread form (`Math.min(...arr)`)
 * also overflows the call stack at ~100k+ values.
 */
export declare function seriesValueRange(series: Series[]): SeriesValueRange;
/** Fold extra values (e.g. goal-line targets) into a range so the axis covers them even when
 *  they sit outside the data's natural extent. */
export declare function extendValueRange(range: SeriesValueRange, values: readonly number[]): SeriesValueRange;
/** Round `minPositive` down to the previous decade, `max` up to the next round multiple
 *  of its top decade (e.g. 740 → 800, 4200 → 5000). */
export declare function niceLogDomain(minPositive: number, max: number): [number, number];
export declare function createXScale(labels: string[], dimensions: ChartDimensions): ScalePoint<string>;
export declare function yTickCountForHeight(plotHeight: number): number;
/** Repair a fixed, caller-supplied `[min, max]` domain so it can't map every value to NaN. A
 *  non-finite bound (e.g. a `Math.max(...[])` that yielded `-Infinity`, or a `0/0`) falls back to
 *  `[0, 1]`; a collapsed `min === max` domain gets a unit span. Keeps the caller's finite bounds
 *  otherwise, only normalizing an inverted order. */
export declare function sanitizeFixedDomain([min, max]: readonly [number, number]): [number, number];
export declare function createYScale(series: Series[], dimensions: ChartDimensions, options?: {
    scaleType?: 'linear' | 'log';
    percentStack?: boolean;
    /** Fixed `[min, max]` or `{ include }` extra values the domain must cover. */
    valueDomain?: ValueDomain;
    /** Float the axis to its data range instead of clamping the baseline to 0. See {@link buildValueScale}. */
    floatBaseline?: boolean;
}): ScaleLinear<number, number> | ScaleLogarithmic<number, number>;
/** Build a value (y, or x for horizontal) scale from a precomputed {@link SeriesValueRange}, applying
 *  the overlay-aware zero-baseline clamp, the degenerate `min === max` guard, and the log/no-positive
 *  fallback. Single source of truth shared by `createYScale` and the combo chart's per-axis scales so
 *  the baseline logic can't drift between them. */
export declare function buildValueScale(options: {
    range: SeriesValueRange;
    /** Pixel range `[lowEdge, highEdge]` — for a vertical y-scale this is `[bottom, top]`. */
    valueRange: [number, number];
    tickCount: number;
    scaleType?: 'linear' | 'log';
    /** Range used for the overlay-aware zero-baseline clamp; defaults to `range`. Overlays
     *  (trendlines, moving averages) may dip below 0 when the underlying data doesn't — they
     *  shouldn't drag the baseline negative, since `d3.nice()` on a slightly-negative min yields a
     *  disproportionately large negative tick (e.g. [-1, 14500] → [-2000, 16000]). */
    primaryRange?: SeriesValueRange;
    /** Keep a negative min even when the primary data is non-negative (an explicit negative goal). */
    allowNegativeBaseline?: boolean;
    /** Skip the zero-baseline clamp entirely so the axis floats to its data range (a y-axis "start at
     *  zero = off"). The default clamps a non-negative axis down to 0. Has no effect on a log scale. */
    floatBaseline?: boolean;
}): D3YScale;
/** Map raw d3 per-axis scales into the public {@link YAxisScale} shape (value→pixel fn + tick
 *  accessor + side). Shared by every multi-axis chart's `createScales` so the wrapping is uniform. */
export declare function toYAxisScales(d3Axes: Record<string, {
    scale: D3YScale;
    position: 'left' | 'right';
}>, tickCount: number): Record<string, YAxisScale>;
/** Topmost visible series key per axis id — the cap-rounded layer of each stack. Iteration order
 *  matches d3.stack's key order, so the last write per axis is that axis's top layer. `skip` lets a
 *  mixed-type chart exclude non-bar series so only bars determine the cap. */
export declare function computeTopStackedKeyByAxis<S extends Pick<Series, 'key' | 'visibility' | 'yAxisId'>>(series: readonly S[], options?: {
    skip?: (s: S) => boolean;
}): Map<string, string>;
/** Order the visible series' axis ids — DEFAULT_Y_AXIS_ID first (when present), then the
 *  remaining ids in first-encountered order — and assign alternating positions starting on the
 *  left: index 0 left, 1 right, 2 left, 3 right, … Each side stacks its gutters outward in this
 *  order. Mirrors the legacy multi-axis trends rendering and is shared by the scale builders and
 *  the margin/axis-label layout so they agree on how many gutters sit on each side. */
export declare function orderedAxisPositions(series: Series[]): {
    axisId: string;
    position: 'left' | 'right';
}[];
/** Bucket visible series by axis id in a single O(series) pass so per-axis scale builders look
 *  their series up instead of re-filtering the whole list per axis (which is O(series²) when each
 *  series has its own axis, as in `showMultipleYAxes`). */
export declare function groupVisibleSeriesByAxis(series: Series[]): Map<string, Series[]>;
export declare function createScales(series: Series[], labels: string[], dimensions: ChartDimensions, options?: {
    scaleType?: 'linear' | 'log';
    percentStack?: boolean;
    /** Applied to the primary y-axis only — goal lines (`{ include }`) render against the
     *  primary axis, so secondary axes keep their own data-derived scale. */
    valueDomain?: ValueDomain;
    /** Per-axis overrides — explicit values win over the alternating-side default and the
     *  scalar `scaleType`/`floatBaseline` options (which only reach the primary axis). */
    axes?: {
        id: string;
        position?: 'left' | 'right';
        scaleType?: 'linear' | 'log';
        startAtZero?: boolean;
    }[];
    /** Float the primary axis to its data range instead of clamping the baseline to 0. Applied to
     *  the primary axis only, like `valueDomain`. See {@link buildValueScale}. */
    floatBaseline?: boolean;
}): ScaleSet;
export interface StackedBand {
    top: number[];
    bottom: number[];
}
export declare function computeStackData(series: Series[], labels: string[]): Map<string, StackedBand>;
export declare function computePercentStackData(series: Series[], labels: string[]): Map<string, StackedBand>;
/** Stack that preserves negative segments — positives accumulate upward from 0, negatives
 *  downward from 0 (stackOffsetDiverging). Used by Lifecycle, where `dormant` is emitted
 *  as a negative series so it renders below the zero baseline. */
export declare function computeDivergingStackData(series: Series[], labels: string[]): Map<string, StackedBand>;
/** Returns the stacked top of each series so the tooltip anchor and value-label position
 *  land at the visual top of each segment. This is a *position* resolver — for the value
 *  to *display* (the segment, not the cumulative total) use {@link buildSegmentResolveValue}.
 *  Falls back to the raw value when the series isn't part of the stack (e.g. trend-line
 *  overlays, CI bands). */
export declare function buildStackedPositionValue(stackedData: Map<string, StackedBand> | undefined): ResolveValueFn | undefined;
/** Returns each series's own segment height (`top − bottom`) — the per-series value to
 *  display, not the cumulative stack total. Falls back to the raw value for series not in
 *  the stack. Pair with {@link buildStackedPositionValue} for anchor positioning. */
export declare function buildSegmentResolveValue(stackedData: Map<string, StackedBand> | undefined): ResolveValueFn | undefined;
/** Returns the stacked bottom value for each series — use with {@link buildStackedPositionValue}
 *  to compute per-segment midpoints for tooltip hover detection. */
export declare function buildStackedBottomValue(stackedData: Map<string, StackedBand> | undefined): ResolveValueFn | undefined;
export interface BarScaleSet {
    band: ScaleBand<string>;
    value: D3YScale;
    /** Sub-band for grouped layout — maps a series key to its offset inside a band. */
    group?: ScaleBand<string>;
    /** Per-axis value scales keyed by axis id. Only populated for grouped layouts with
     *  more than one axis id across the visible series (`showMultipleYAxes`). `value` is
     *  the primary (left) axis scale. */
    yAxes?: Record<string, {
        scale: D3YScale;
        position: 'left' | 'right';
    }>;
    /** Px floor on bar thickness along the value axis — see {@link BarsConfig.minBarSize}. A layout
     *  parameter rather than a scale, but carried here because every path that resolves a bar *rect*
     *  (static draw, hover overlay, click routing) already reads the committed scale set, so the
     *  floor can't drift between them. Tooltip/value-label anchoring (`buildTooltipContext`) is a
     *  separate path that positions off the unfloored value, not the drawn rect — a floored bucket's
     *  anchor can land inside the bar it labels. */
    minBarSize?: number;
}
/** Band-axis slot of one series's bar within a grouped band: `{ x, width }` along the band axis.
 *  The single source of truth for grouped bar geometry — used for drawing, hit-testing, and
 *  tooltip anchoring. Returns undefined for non-grouped layouts or a series not in the group. */
export declare function groupedBandSlot(scales: BarScaleSet, label: string, seriesKey: string): BandSlot | undefined;
export declare function createBarScales(series: Series[], labels: string[], dimensions: ChartDimensions, options?: {
    scaleType?: 'linear' | 'log';
    barLayout?: 'stacked' | 'grouped' | 'percent';
    axisOrientation?: 'vertical' | 'horizontal';
    bandPadding?: number;
    groupPadding?: number;
    stackedSeries?: Series[];
    /** Cap on the band-axis range in px — clusters bars at the start of the plot when set. */
    maxBandRange?: number;
    /** Horizontal fit-to-height mode: drop the rows that can't fit at `minBandSize` so bands
     *  never crush below it and the plot fills the height it's given. Requires `minBandSize`. */
    fitToHeight?: boolean;
    /** Minimum px per row — only consulted to compute the `fitToHeight` row cap. */
    minBandSize?: number;
    /** Px floor on bar thickness along the value axis — see {@link BarsConfig.minBarSize}. */
    minBarSize?: number;
    /** Fixed `[min, max]` or `{ include }` extra values the value axis must cover. */
    valueDomain?: ValueDomain;
    /** Px reserved past the bars at the value-axis data end(s) — see {@link BarsConfig.valuePadding}. */
    valuePadding?: number;
    /** Per-axis overrides — explicit values win over the alternating-side default and `options.scaleType`. */
    axes?: {
        id: string;
        position?: 'left' | 'right';
        scaleType?: 'linear' | 'log';
    }[];
}): BarScaleSet;
export declare function autoFormatYTick(value: number, domainMax: number): string;
export declare function autoFormatterFor(ticks: number[]): (value: number) => string;
export declare function resolveYScaleForSeries<S extends (value: number) => number>(scales: {
    y: S;
    yAxes?: Record<string, {
        scale: S;
    }>;
}, series: Pick<Series, 'yAxisId'>): S;
