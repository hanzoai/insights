import { default as React } from 'react';
export interface SlopeSeriesLabelsProps {
    /** Render the series name labels. Default true. */
    show?: boolean;
    /** Px to the right of the last point where the name labels begin. */
    offsetX?: number;
}
/** Series name labels anchored beside each series' last point. When two names would overlap, the
 *  series with the larger change (`|end − start|`) wins — it is always kept, and lower-change names
 *  that collide with it are dropped (requirement: the steepest line never loses its label). */
export declare function SlopeSeriesLabels({ show, offsetX }: SlopeSeriesLabelsProps): React.ReactElement | null;
