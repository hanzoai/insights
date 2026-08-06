import { default as React } from 'react';
import { RadialSlicePayload } from '../../core/hooks/useRadialInteraction';
import { ChartLegendConfig, ChartTheme, ResolvedSeries, Series, TooltipContext } from '../../core/types';
export interface PieChartConfig<Meta = unknown> {
    /** 0 = pie (default), 0.5 = donut. Clamped to [0, 0.95]. */
    innerRadiusRatio?: number;
    /** Show the slice value above the slice (per Chart.js parity). Default true. */
    showValueOnSlice?: boolean;
    /** Show the breakdown label above the slice. Default false. */
    showLabelOnSlice?: boolean;
    /** Render slice values as percentages of total. Drives both axes-label-style formatting
     *  and the on-slice / tooltip formatting. */
    isPercent?: boolean;
    /** Pixels the hovered slice's outer radius grows on hover (center stays fixed). Default 8. */
    hoverGrowth?: number;
    /** Duration (ms) of the hover transition — the slice eases outward and brightens over this
     *  window rather than snapping. Default 150. `0` disables (instant). */
    hoverAnimationMs?: number;
    /** Disable the hover grow effect — useful for snapshot stability or constrained layouts.
     *  Legacy name: this gates the whole hover effect (grow + brighten + dim), not just an offset. */
    disableHoverOffset?: boolean;
    /** Hide on-slice labels for slices smaller than this fraction of the total. Default 0.05. */
    minSlicePercentForLabel?: number;
    /** Where on-slice labels sit along the radius: 0 = center, 1 = outer edge. Default 0.5 (mid-slice).
     *  Higher values push labels toward the rim, onto the wider part of each wedge. */
    labelRadiusRatio?: number;
    /** Radians gap between slices. Default 0. */
    padAngle?: number;
    /** Slice ordering. `null` (default) preserves input order — needed for stable
     *  per-series colors. Pass a comparator on slice magnitudes to sort visually. */
    sort?: ((a: number, b: number) => number) | null;
    /** Slice magnitude resolver. Defaults to sum of finite, positive entries in `series.data`. */
    sliceValue?: (series: ResolvedSeries<Meta>) => number;
    /** Tooltip behavior. */
    tooltip?: {
        enabled?: boolean;
    };
    /** Built-in legend, one row per slice. Hidden by default; toggling a row off removes the
     *  slice and the rest rescale to the full circle. Same semantics as the other charts. */
    legend?: ChartLegendConfig;
}
export interface PieChartProps<Meta = unknown> {
    series: Series<Meta>[];
    theme: ChartTheme;
    config?: PieChartConfig<Meta>;
    tooltip?: (ctx: TooltipContext<Meta>) => React.ReactNode;
    onSliceClick?: (payload: RadialSlicePayload<Meta>) => void;
    className?: string;
    /** `data-attr` applied to the chart wrapper. */
    dataAttr?: string;
    /** Custom value formatter used by the on-slice value label and the default tooltip.
     *  Receives the raw slice magnitude; the chart handles percent conversion when
     *  `isPercent` is on. */
    valueFormatter?: (value: number) => string;
    /** Optional content rendered at the center of the chart — typically the aggregation
     *  total for a donut. Receives the layout so consumers can position custom content. */
    centerLabel?: React.ReactNode;
    /** React children passed through to the radial overlay layer (custom decorations). */
    children?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}
export declare function PieChart<Meta = unknown>({ onError, ...rest }: PieChartProps<Meta>): React.ReactElement;
