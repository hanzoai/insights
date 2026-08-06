import { default as React } from 'react';
export interface SlopeValueLabelsProps {
    valueFormatter?: (value: number) => string;
    /** Chart-level default for the start (left) value labels. Per-series `meta.showStartLabel` wins. */
    showStartLabels?: boolean;
    /** Chart-level default for the end (right) value labels. Per-series `meta.showEndLabel` wins. */
    showEndLabels?: boolean;
    /** Px gap between the point and its value label. */
    gap?: number;
    /** Min vertical px between two labels in the same column before the lower one is dropped. */
    minGap?: number;
}
/** Start (left) and end (right) value labels for a slope chart, one per series per side. Each side
 *  is a vertical column anchored on the points; within a column, lower-priority labels are
 *  dropped on collision. Per-series visibility comes from `meta.showStartLabel`/`showEndLabel`. */
export declare function SlopeValueLabels({ valueFormatter, showStartLabels, showEndLabels, gap, minGap, }: SlopeValueLabelsProps): React.ReactElement | null;
