import { ResolvedSeries } from './types';
export interface PieSlice<Meta = unknown> {
    /** Index into the *original* (pre-exclusion) series array. */
    seriesIndex: number;
    series: ResolvedSeries<Meta>;
    /** Absolute slice magnitude. Negative inputs are clamped to 0 — a pie can't render them. */
    value: number;
    /** value / total (0 when total is 0). */
    fraction: number;
    /** Radians, 12 o'clock = 0, increasing clockwise (d3.pie convention). */
    startAngle: number;
    endAngle: number;
    /** Bisector angle — anchor for pop-out and on-slice labels. */
    centroidAngle: number;
    color: string;
}
export interface PieLayout<Meta = unknown> {
    slices: PieSlice<Meta>[];
    total: number;
    cx: number;
    cy: number;
    /** Outer slice radius, *excluding* hover pop-out room. */
    outerRadius: number;
    /** Inner radius (0 for pie, > 0 for donut). */
    innerRadius: number;
    /** Radians gap between adjacent slices. */
    padAngle: number;
}
/** Maps a cursor offset (dx, dy) from the chart center to an angle in radians, matching
 *  the d3.pie convention: 12 o'clock = 0, increasing clockwise, range [0, 2π). */
export declare function cursorOffsetToAngle(dx: number, dy: number): number;
export interface SliceAtOptions {
    /** Allowance beyond `outerRadius` so the popped-out slice still registers as hovered. */
    outerSlack?: number;
}
/** Returns the index of the slice under the cursor, or -1.
 *  - Misses the donut inner hole (`r < innerRadius`).
 *  - Misses past the outer edge plus optional slack.
 *  - Treats `padAngle/2` of each slice's start/end as a gap (no hit).
 *  - Handles d3.pie's 12 o'clock wraparound (slice that crosses 0). */
export declare function sliceAt<Meta>(layout: PieLayout<Meta>, cursor: {
    x: number;
    y: number;
}, { outerSlack }?: SliceAtOptions): number;
