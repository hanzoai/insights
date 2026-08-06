import { YAxis } from '../types';
export interface YAxisMaps {
    /** Per-axis tick formatters keyed by axis id — only axes that define one. Absent when no axis does. */
    formatters?: Record<string, (value: number) => string>;
    /** Per-axis side keyed by axis id. */
    positions?: Record<string, 'left' | 'right'>;
    /** Per-axis titles keyed by axis id; single-axis charts fall back to the scalar `yAxisLabel`. */
    titles: Record<string, string>;
    /** Axis ids whose tick labels (and margin gutters) are hidden. Absent when no axis hides. */
    hidden?: Record<string, boolean>;
}
/** Per-axis tick formatters, sides, and titles keyed by axis id (formatters/sides are absent for
 *  single-axis charts). */
export declare function useYAxisMaps(yAxes: YAxis[] | undefined, yAxisLabel?: string): YAxisMaps;
