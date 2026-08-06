import { ChartMargins, Series } from '../types';
export declare const DEFAULT_MARGINS: ChartMargins;
/** Horizontal gap between stacked value-axis gutters on the same side — shared by the margin
 *  reservation here and the gutter rendering in AxisLabels so the two can't drift. */
export declare const GUTTER_GAP = 12;
export declare const X_AXIS_TITLE_MARGIN = 22;
export declare const Y_AXIS_TITLE_MARGIN = 24;
interface UseChartMarginsOptions {
    series: Series[];
    labels: string[];
    hideXAxis: boolean;
    hideYAxis: boolean;
    xAxisLabel?: string;
    xTickFormatter?: (value: string, index: number) => string | null;
    yTickFormatter?: (value: number) => string;
    axisOrientation?: 'vertical' | 'horizontal';
    /** Per-side overrides applied on top of the computed margins. */
    override?: Partial<ChartMargins>;
    /** Override the value-range source for value-axis tick sizing. Defaults to `series`. Use
     *  this when the visible series's `data[i]` doesn't span the full y-domain — e.g. BoxPlot
     *  passes the whisker min/max samples so the y-tick column fits the actual range, not just
     *  the medians it draws on `series.data`. yAxis-id discovery still reads from `series`. */
    valueRangeSeries?: Series[];
    /** When set, clamp the reserved category-label width to this ceiling so a single long label
     *  can't grow the axis margin without bound. Mirrors AxisLabels' display truncation. */
    maxCategoryLabelWidth?: number;
    /** Per-axis tick formatters keyed by axis id, for sizing each gutter against its own labels.
     *  Falls back to `yTickFormatter` for axes not listed. Multi-axis charts only. */
    yAxisFormatters?: Record<string, (value: number) => string>;
    /** Per-axis sides keyed by axis id, overriding the alternating-side default. Keeps the margin
     *  reservation in step with the scales' config-driven positions. Multi-axis charts only. */
    yAxisPositions?: Record<string, 'left' | 'right'>;
    yAxisTitles?: Record<string, string>;
    /** Axis ids whose gutters are hidden — no margin reserved. Mirrors `computeYAxisGutters`. */
    yAxisHidden?: Record<string, boolean>;
}
/** Apply per-side overrides, skipping sides left `undefined`. A plain spread would write the
 *  `undefined` through and clobber the computed margin, which turns the whole plot geometry into
 *  `NaN` and renders a blank chart — so a caller building an override object conditionally
 *  (`{ top: reserveOrUndefined }`) gets "leave this side alone" rather than a silent wipeout. */
export declare function applyMarginOverride(computed: ChartMargins, override: Partial<ChartMargins>): ChartMargins;
export declare function applyMarginOverride(computed: Partial<ChartMargins>, override: Partial<ChartMargins>): Partial<ChartMargins>;
export declare function useChartMargins({ series, labels, hideXAxis, hideYAxis, xAxisLabel, xTickFormatter, yTickFormatter, axisOrientation, override, valueRangeSeries, maxCategoryLabelWidth, yAxisFormatters, yAxisPositions, yAxisTitles, yAxisHidden, }: UseChartMarginsOptions): ChartMargins;
export {};
