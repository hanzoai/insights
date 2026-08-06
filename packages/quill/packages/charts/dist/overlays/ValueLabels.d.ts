import { default as React } from 'react';
export type ValueLabelsMode = 'per-segment' | 'stack-total';
/** Per-segment context handed to a value formatter so callers can compute labels that depend on
 *  the band (e.g. each segment's share of its band). Keeps band/stacking knowledge in the library
 *  while leaving the label text — values, percentages, units — entirely to the caller. */
export interface ValueLabelContext {
    /** Underlying value of this segment (the band total for stack-total labels). In percent layout
     *  the formatter's `value` arg is the segment's fraction (0..1); `rawValue` stays the original so
     *  callers can compute their own shares. */
    rawValue: number;
    /** Finite values of every series contributing to this band's stack (non-excluded, not a fill
     *  lower-bound, not an overlay) at this dataIndex — the denominator set for share math. */
    bandValues: number[];
    /** Same as `bandValues` for the preceding dataIndex; empty at the first index. */
    previousBandValues: number[];
    /** True in normalized/percent layout, where `value` is already a fraction. */
    isPercent: boolean;
}
/** Returning an empty string skips the label entirely. */
export type ValueLabelFormatter = (value: number, 
/** `-1` for stack-total labels. */
seriesIndex: number, dataIndex: number, context: ValueLabelContext) => string;
export interface ValueLabelsProps {
    valueFormatter?: ValueLabelFormatter;
    minGap?: number;
    mode?: ValueLabelsMode;
    /** Gap in px between the bar tip and the label, applied along the value axis in the outward
     *  direction (right/above the tip, or inward for labels flipped inside a clipped bar). Ignored
     *  for centered (`percent`) labels. Defaults to 0 — the label's edge sits on the bar tip. */
    offset?: number;
}
export declare function ValueLabels({ valueFormatter, minGap, mode, offset, }: ValueLabelsProps): React.ReactElement | null;
