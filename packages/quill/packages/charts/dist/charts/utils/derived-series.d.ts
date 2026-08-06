import { Series } from '../../core/types';
export type { TrendLineConfig } from './use-derived-series';
export interface BuildConfidenceIntervalSeriesInput<Meta = unknown> {
    seriesKey: string;
    label: string;
    baseColor?: string;
    lower: number[];
    upper: number[];
    yAxisId?: string;
    meta?: Meta;
    excluded?: boolean;
}
export declare function buildConfidenceIntervalSeries<Meta = unknown>(input: BuildConfidenceIntervalSeriesInput<Meta>): Series<Meta>;
export interface BuildMovingAverageSeriesInput<Meta = unknown> {
    sourceSeries: Series<Meta>;
    window: number;
    label?: string;
    excluded?: boolean;
}
export declare function movingAverageKey(sourceKey: string): string;
export declare function buildMovingAverageSeries<Meta = unknown>(input: BuildMovingAverageSeriesInput<Meta>): Series<Meta>;
export interface BuildTrendLineSeriesInput<Meta = unknown> {
    sourceSeries: Series<Meta>;
    kind: 'linear' | 'exponential';
    label?: string;
    /** When set, only the prefix `[0, fitUpTo)` contributes to the regression, but the
     *  trend is extrapolated across the full data range. Useful for excluding an
     *  in-progress tail so the partial bucket doesn't drag the slope. */
    fitUpTo?: number;
    excluded?: boolean;
}
/** Linear or exponential regression rendered as a dimmed dotted line. Exponential is
 *  fitted in log-space and exp'd back, so it falls back to linear when any value in the
 *  fit range is non-positive (log-space is undefined there). Colour dimming is applied
 *  only to hex source colours; non-hex inputs are passed through untouched (mirrors
 *  `applyComparisonDimming`). */
export declare function buildTrendLineSeries<Meta = unknown>(input: BuildTrendLineSeriesInput<Meta>): Series<Meta>;
