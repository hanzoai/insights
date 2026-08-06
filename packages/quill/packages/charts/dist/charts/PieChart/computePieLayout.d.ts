import { PieLayout } from '../../core/radial-layout';
import { ResolvedSeries } from '../../core/types';
export { cursorOffsetToAngle, sliceAt } from '../../core/radial-layout';
export type { PieLayout, PieSlice, SliceAtOptions } from '../../core/radial-layout';
export interface PlotBox {
    plotLeft: number;
    plotTop: number;
    plotWidth: number;
    plotHeight: number;
}
export interface ComputePieLayoutOptions<Meta = unknown> {
    series: ResolvedSeries<Meta>[];
    dimensions: PlotBox;
    /** Magnitude resolver. Defaults to sum of finite, positive entries in `series.data`. */
    sliceValue?: (series: ResolvedSeries<Meta>) => number;
    /** 0 = pie, 0.5 = donut. Clamped to [0, 0.95]. */
    innerRadiusRatio?: number;
    /** Radians gap between slices. Defaults to 0. */
    padAngle?: number;
    /** Sort comparator on slice magnitudes, or `null` to preserve input order. Defaults to `null`. */
    sort?: ((a: number, b: number) => number) | null;
    /** Outer-radius scale factor — pulls the outer edge in to leave room for hover pop-out
     *  and labels. Defaults to 0.92. */
    radiusPadding?: number;
}
export declare function defaultSliceValue<Meta>(s: ResolvedSeries<Meta>): number;
export declare function computePieLayout<Meta = unknown>(opts: ComputePieLayoutOptions<Meta>): PieLayout<Meta>;
