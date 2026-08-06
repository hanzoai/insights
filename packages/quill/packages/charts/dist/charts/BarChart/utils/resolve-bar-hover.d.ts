import { BarRect } from '../../../core/canvas-renderer';
import { BarScaleSet, StackedBand } from '../../../core/scales';
import { ChartDrawArgs, ResolvedSeries } from '../../../core/types';
import { BarLayout } from './bars-under-cursor';
export interface BarHoverItem {
    series: ResolvedSeries;
    bar: BarRect;
    isTrackHighlight: boolean;
}
export interface ResolvedBarHover {
    items: BarHoverItem[];
    /** Per-series bar-vs-track composition string. The caller keys its fade restart on this so a
     *  bar → track move at the same `hoverIndex` still restarts the fade. */
    composition: string;
    /** Rounded pills to clip the highlight to (matches the resting bars under `roundStackEnds`),
     *  or empty when not rounding stack ends. */
    hoveredBandPills: BarRect[];
}
export interface ResolveBarHoverArgs {
    barLayout: BarLayout;
    isHorizontal: boolean;
    stackedData: Map<string, StackedBand> | undefined;
    topStackedKeyByAxis: Map<string, string>;
    roundStackEnds: boolean;
    barTrackHover: boolean;
}
/** Resolve which bars (or tracks) the hovered band should highlight, plus the pill clip and a
 *  composition key. Pure — the stateful fade bookkeeping stays in the caller, which owns the
 *  alpha and then hands the result to `drawBarHoverItems`. Returns `null` when nothing is
 *  under the cursor. */
export declare function resolveBarHoverItems({ series: coloredSeries, labels: drawLabels, hoverIndex, hoverPosition }: ChartDrawArgs, d3Scales: BarScaleSet, { barLayout, isHorizontal, stackedData, topStackedKeyByAxis, roundStackEnds, barTrackHover }: ResolveBarHoverArgs): ResolvedBarHover | null;
