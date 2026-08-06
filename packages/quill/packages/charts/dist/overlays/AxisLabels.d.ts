import { default as React } from 'react';
interface AxisLabelsProps {
    xTickFormatter?: (value: string, index: number) => string | null;
    yTickFormatter?: (value: number) => string;
    hideXAxis?: boolean;
    hideYAxis?: boolean;
    axisColor?: string;
    orientation?: 'vertical' | 'horizontal';
    /** Optional override for label → coord mapping. Falls back to `scales.x`, which chart types
     *  serving horizontal orientation are expected to set to a label→band-center function. */
    labelToCoord?: (label: string) => number | undefined;
    /** When set, truncate category tick labels wider than this (px) with an ellipsis and reveal
     *  the full value on hover. Omitted (default) renders labels untruncated. */
    maxCategoryLabelWidth?: number;
}
interface XLabelCandidate {
    index: number;
    /** Display text — truncated to `maxCategoryLabelWidth` when one is set. */
    text: string;
    /** Full value, present only when `text` was truncated, so hover can reveal it. */
    title?: string;
    x: number;
}
export declare function computeVisibleXLabels(labels: string[], xScale: (label: string) => number | undefined, formatter?: (value: string, index: number) => string | null, maxCategoryLabelWidth?: number): XLabelCandidate[];
interface ValueTickCandidate {
    tick: number;
    text: string;
    x: number;
}
/** Value-axis ticks for a horizontal bar chart map onto the x-axis, where wide numeric labels
 *  (e.g. "450,000") collide far more readily than stacked y-axis labels do. Greedily drop the
 *  ones that would overlap so the axis stays legible — the same pass `computeVisibleXLabels`
 *  applies to a vertical chart's category axis. Ticks arrive value-sorted, so ascending value
 *  maps to ascending x for an increasing value scale. */
export declare function computeVisibleValueTicks(ticks: number[], valueToCoord: (value: number) => number, formatter?: (value: number) => string): ValueTickCandidate[];
/** Thin value-axis ticks whose stacked labels would overlap vertically, keeping the roundest values
 *  (powers of ten, then 5s, then 2s) so a crowded axis — chiefly a log scale — reads as clean 1-2-5
 *  decade labels instead of an unreadable smear. Linear axes are `.nice()`-bounded to comfortably
 *  spaced ticks, so every one clears the gap and all are kept unchanged. Returns ticks in ascending
 *  value order, matching the input. */
export declare function computeVisibleYTicks(ticks: number[], valueToCoord: (value: number) => number, minGap?: number): number[];
export declare const AxisLabels: React.MemoExoticComponent<({ xTickFormatter, yTickFormatter, hideXAxis, hideYAxis, axisColor, orientation, labelToCoord, maxCategoryLabelWidth, }: AxisLabelsProps) => React.ReactElement | null>;
export {};
