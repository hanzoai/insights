import { Series, ValueDomain } from '../core/types';
import { ReferenceLineProps } from '../overlays/ReferenceLine';
export interface GoalLineConfig {
    value: number;
    label?: string;
    displayLabel?: boolean;
    color?: string;
    labelPosition?: 'start' | 'end';
    displayIfCrossed?: boolean;
}
export declare function computeSeriesNonZeroMax(series: Series[]): number;
export declare function buildGoalLineReferenceLines(lines: readonly GoalLineConfig[] | null | undefined, series: Series[]): ReferenceLineProps[];
/** Numeric values of a set of reference lines as a {@link ValueDomain}, so the chart's value axis
 *  stretches to keep off-scale goal lines on-plot. Returns `undefined` when there's nothing to add. */
export declare function goalLineValueDomain(referenceLines: readonly ReferenceLineProps[]): ValueDomain | undefined;
