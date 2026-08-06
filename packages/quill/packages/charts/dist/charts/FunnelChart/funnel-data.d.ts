import { Series } from '../../core/types';
export declare const RATE_TO_PERCENT = 100;
/** Conversion of a step's count against a basis count, as a 0..1 rate. A zero or absent basis
 *  yields 0 (rather than dividing by zero) so the bar collapses instead of rendering NaN. */
export declare function funnelConversionRate(count: number, basisCount: number): number;
export interface FunnelStepCount {
    label: string;
    count: number;
}
export interface FunnelFromCountsOptions {
    key?: string;
    label?: string;
    color?: string;
}
/** Builds the `steps` + single-`series` pair for a no-breakdown funnel from raw step counts,
 *  with each step valued as its conversion from the first step (percent, 0–100). Multi-variant
 *  funnels resolve their own per-variant percentages and pass
 *  `Series[]` directly. */
export declare function funnelFromCounts(steps: FunnelStepCount[], options?: FunnelFromCountsOptions): {
    steps: string[];
    series: Series[];
};
