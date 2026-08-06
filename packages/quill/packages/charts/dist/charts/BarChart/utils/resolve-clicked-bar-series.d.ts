import { BarScaleSet, StackedBand } from '../../../core/scales';
import { PointClickData, Series } from '../../../core/types';
import { BarLayout } from './bars-under-cursor';
export interface ResolveClickedBarSeriesArgs<Meta> {
    clickData: PointClickData<Meta>;
    scales: BarScaleSet;
    barLayout: BarLayout;
    isHorizontal: boolean;
    stackedData: Map<string, StackedBand> | undefined;
    topStackedKeyByAxis: Map<string, string>;
    series: Series<Meta>[];
    labels: readonly string[];
}
/** Rewrites the click payload to the bar series actually under the cursor. The base payload
 *  always points at the first series in the band; this picks the right one per layout:
 *   - grouped: the series whose sub-band column the cursor is over — band axis only, so a
 *     click above a short bar (or on its track) still resolves to that column.
 *   - stacked/percent: the segment whose rect contains the cursor on the value axis, walking
 *     every dataIndex in the band so sparse-overlap segments route correctly, and re-reading
 *     the value at that segment's own dataIndex.
 *  Pure so the routing is unit-testable; returns `null` to pass `clickData` through unchanged. */
export declare function resolveClickedBarSeries<Meta>({ clickData, scales, barLayout, isHorizontal, stackedData, topStackedKeyByAxis, series, labels, }: ResolveClickedBarSeriesArgs<Meta>): PointClickData<Meta> | null;
