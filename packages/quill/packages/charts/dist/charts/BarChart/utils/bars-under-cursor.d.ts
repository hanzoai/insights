import { BarRect } from '../../../core/canvas-renderer';
import { BarScaleSet, StackedBand } from '../../../core/scales';
import { BandSlot, Series } from '../../../core/types';
export type BarLayout = 'stacked' | 'grouped' | 'percent';
export declare function isStackedLayout(layout: BarLayout): boolean;
/** Grouped-layout hit-test that ignores the value axis so a cursor above (or below) a bar still
 *  selects the bar whose band-slot it lines up with. Matches chart.js's `mode: 'point', axis: 'x'`
 *  behaviour — without this, hovering above a short bar in a grouped pair would fail every
 *  per-bar check, fall back to "highlight all", and visually flag both group-mates at once.
 *  Half-open on the trailing edge — matches d3 band-scale slots `[start, start + size)`. */
export declare function barContainsPointOnBandAxis(bar: BarRect, point: {
    x: number;
    y: number;
}, isHorizontal: boolean): boolean;
/** Full-rect (both axes) hit-test. Stacked segments share a band slot; the value axis is
 *  what distinguishes them. Half-open on the trailing edge — matches d3 band-scale slots
 *  `[start, start + size)`. */
export declare function barContainsPoint(bar: BarRect, point: {
    x: number;
    y: number;
}): boolean;
/** True when the cursor is in the bar's band slot but outside its filled value extent —
 *  the strict complement of {@link barContainsPointOnBandAxis} on the value axis. Used
 *  to distinguish track-region hover from bar-region hover. Caller is expected to have
 *  already established band-axis containment. */
export declare function cursorOutsideBarFillExtent(bar: BarRect, point: {
    x: number;
    y: number;
}, isHorizontal: boolean): boolean;
/** True when the cursor sits beyond a series' per-bar track ceiling — the blank, inert region above a
 *  capped `trackData` track (a funnel compare bar's volume gap). False when the series has no ceiling
 *  at this bar (the track spans the whole axis). Callers establish band-axis containment and that the
 *  cursor is already outside the bar's own fill before calling. */
export declare function cursorBeyondTrackCeiling(series: {
    trackData?: number[];
}, bar: BarRect, scales: BarScaleSet, point: {
    x: number;
    y: number;
}, isHorizontal: boolean): boolean;
export interface BarsAtCursorArgs {
    series: readonly Pick<Series, 'key' | 'visibility' | 'yAxisId' | 'data'>[];
    label: string;
    dataIndex: number;
    scales: BarScaleSet;
    layout: BarLayout;
    isHorizontal: boolean;
    stackedData?: Map<string, StackedBand>;
    topStackedKeyByAxis: Map<string, string>;
}
export interface BarAtCursor<S> {
    series: S;
    bar: BarRect;
}
/** Yields the renderable `{ series, bar }` for every visible series at `(label, dataIndex)`.
 *  Single source of truth shared by drawHover, tooltip narrowing, and click routing —
 *  encapsulates visibility skip, stacked-band lookup, and `computeBarAtIndex`. Eager despite
 *  the generator shape: every bar is computed up front so stacked cap corners can be
 *  re-resolved across the whole band before the first yield. */
export declare function barsAtCursor<S extends Pick<Series, 'key' | 'visibility' | 'yAxisId' | 'data'>>(args: Omit<BarsAtCursorArgs, 'series'> & {
    series: readonly S[];
}): Generator<BarAtCursor<S>>;
/** True when the cursor sits in a bar's inert volume gap — lined up on the band axis with a bar
 *  whose capped `trackData` ceiling it has passed (a funnel compare period's blank space above its
 *  track). Such a position takes no hover, tooltip, highlight, or click. Bars whose track spans the
 *  full axis are never a gap. A grouped cursor lines up with a single column of the group; stacked
 *  segments all share their band slot, so the cursor must clear every segment's fill before a
 *  segment's ceiling can declare the position a gap. */
export declare function cursorInInertTrackGap(args: Omit<BarsAtCursorArgs, 'series'> & {
    series: readonly Pick<Series, 'key' | 'visibility' | 'yAxisId' | 'data' | 'trackData'>[];
    cursor: {
        x: number;
        y: number;
    };
}): boolean;
export interface ResolveBarsAtCursorResult {
    /** Series keys whose bar slot contains the cursor on the band axis (every stacked segment). */
    hits: Set<string>;
    /** Series key whose full rect contains the cursor, or `null`. Used to single out a
     *  stacked segment for tooltip ordering and click routing. */
    strictHit: string | null;
}
/** Single pass that does both band-axis containment (used by stacked tooltips to list every
 *  segment sharing the slot) and full-rect containment (the one segment under the cursor). */
export declare function resolveBarsAtCursor(args: BarsAtCursorArgs & {
    cursor: {
        x: number;
        y: number;
    };
}): ResolveBarsAtCursorResult;
/** Resolve the grouped bar nearest the cursor along the band axis, returning its `{ x, width }`
 *  slot. `bandAxisCursor` is the cursor coordinate on the band axis (x for vertical charts).
 *  Returns undefined for non-grouped layouts (no `group` scale) or an unknown label.
 *  A `scaleBand` is uniform, so the nearest slot index is the cursor's offset from the first
 *  slot center divided by the step — O(1), no scan over the domain. */
export declare function groupedBandSlotAtCursor(scales: BarScaleSet, label: string, bandAxisCursor: number): BandSlot | undefined;
/** Visible stacked segment under the cursor — last-drawn bar whose rect contains it.
 *  Also returns the next-smaller extent (the far edge of the bar that overdraws this
 *  segment's near side); callers clip the highlight rect there so hover preserves z-order.
 *
 *  Overdraw only occurs in the sparse "overlap" layout where sibling segments share a
 *  baseline (each series drawn from value 0, smallest on top). Properly stacked segments
 *  each start where the previous ends, so no sibling shares the hovered segment's baseline
 *  and `nextSmallerExtent` is 0 — the segment's own rect is already the visible slice. */
export declare function findVisibleStackedSegment<S extends Pick<Series, 'key' | 'visibility' | 'yAxisId' | 'data'>>(args: Omit<BarsAtCursorArgs, 'series' | 'label' | 'dataIndex'> & {
    series: readonly S[];
    labels: readonly string[];
    hoveredLabel: string;
    cursor: {
        x: number;
        y: number;
    };
}): {
    series: S;
    bar: BarRect;
    dataIndex: number;
    nextSmallerExtent: number;
} | null;
