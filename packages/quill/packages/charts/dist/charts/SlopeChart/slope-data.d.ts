import { Series, TooltipContext } from '../../core/types';
/** Per-series options read from `Series.meta` by the slope chart. Lets a consumer toggle the
 *  start/end value labels for an individual series without touching the shared `Series` type. */
export interface SlopeSeriesMeta {
    /** Show this series' start (left) value label. Falls back to the chart-level default. */
    showStartLabel?: boolean;
    /** Show this series' end (right) value label. Falls back to the chart-level default. */
    showEndLabel?: boolean;
    /** The last point is the current, still-accumulating period. The chart dashes only the second
     *  half of the connector to show the end — not the whole comparison — is provisional. */
    incompleteEnd?: boolean;
}
export type SlopeSide = 'start' | 'end';
/** Whether a series' value label for `side` should render. Excluded/hidden series never show one;
 *  otherwise the per-series `meta` override wins over the chart-level default. Shared by the gutter
 *  sizing and the label rendering so the reserved margin always matches what is drawn. */
export declare function slopeLabelVisible(series: Pick<Series, 'visibility' | 'meta'>, side: SlopeSide, chartDefault: boolean): boolean;
/** A slope chart series carries exactly two values — `[start, end]`. These helpers read the first
 *  and last entry, substituting 0 when a value is absent. */
export declare function slopeStart(series: Pick<Series, 'data'>): number;
export declare function slopeEnd(series: Pick<Series, 'data'>): number;
export declare function slopeDelta(series: Pick<Series, 'data'>): number;
/** Slope tooltips list one row per series; with many breakdowns an unsorted list is unreadable.
 *  Order rows biggest-to-smallest by the hovered point's value so they match the lines' vertical
 *  order at that x. */
export declare function sortSlopeTooltipRows<Meta>(rows: TooltipContext<Meta>['seriesData']): TooltipContext<Meta>['seriesData'];
export declare function defaultValueFormatter(value: number): string;
export declare function defaultDeltaFormatter(delta: number): string;
