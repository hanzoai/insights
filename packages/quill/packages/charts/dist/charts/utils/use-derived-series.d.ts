import { Series } from '../../core/types';
export interface ConfidenceIntervalConfig {
    seriesKey: string;
    lower: number[];
    upper: number[];
}
export interface MovingAverageConfig {
    seriesKey: string;
    window: number;
    label?: string;
}
export interface TrendLineConfig {
    seriesKey: string;
    kind: 'linear' | 'exponential';
    label?: string;
    /** Restrict the regression fit to indices `[0, fitUpTo)`; trend is still extrapolated
     *  across the full range. Use to exclude an in-progress tail so the partial bucket
     *  doesn't drag the slope. */
    fitUpTo?: number;
}
export interface DerivedSeriesOptions {
    confidenceIntervals?: ConfidenceIntervalConfig[];
    movingAverage?: MovingAverageConfig[];
    trendLines?: TrendLineConfig[];
    /** Map of comparison series key → its primary series key. Comparison series render
     *  at reduced opacity so they read as subordinate to their primary. */
    comparisonOf?: Record<string, string>;
}
/** Builds CI bands, moving averages, and trend lines from `source` and merges them
 *  with the source series in paint order: CI behind, then main, then MA, then trend
 *  lines on top (matches `LineChart.drawStatic` array iteration). Comparison-period
 *  dimming runs as a final pass. Returns the original `source` reference when no
 *  derived-series options are set. */
export declare function useDerivedSeries<Meta>(source: Series<Meta>[], options: DerivedSeriesOptions): Series<Meta>[];
/** Trend-line series for charts that render trends as an SVG overlay ({@link TrendLineOverlay})
 *  instead of folding them into the drawn series the way {@link useDerivedSeries} does — the
 *  bar-based time-series charts. Same construction and memo-signature rules as the trend-line
 *  slice of {@link useDerivedSeries}. */
export declare function useTrendLineSeries<Meta>(source: Series<Meta>[], trendLines: TrendLineConfig[] | undefined): Series<Meta>[];
