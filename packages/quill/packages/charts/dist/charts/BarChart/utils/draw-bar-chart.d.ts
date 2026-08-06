import { BarScaleSet, StackedBand } from '../../../core/scales';
import { BarChartConfig, BarFillStyle, BarsConfig, ChartDrawArgs } from '../../../core/types';
import { BarLayout } from './bars-under-cursor';
import { ResolvedBarHover } from './resolve-bar-hover';
export interface DrawBarChartStaticArgs {
    barLayout: BarLayout;
    isHorizontal: boolean;
    showGrid: boolean;
    axisLines: {
        x: boolean;
        y: boolean;
    };
    xTickFormatter: BarChartConfig['xTickFormatter'];
    stackedData: Map<string, StackedBand> | undefined;
    topStackedKeyByAxis: Map<string, string>;
    roundStackEnds: boolean;
    barCornerRadius: number;
    barTrack: boolean;
    barShadow: BarsConfig['shadow'];
    barFillStyle: BarFillStyle;
}
/** The full static pass: grid, bars, optional tracks, optional drop shadow and rounded stack
 *  pills. Reads the d3 scales from the committed `ChartScales._private` slot so it works off a
 *  self-contained per-render object. No React, no component state. */
export declare function drawBarChartStatic({ ctx, dimensions, scales, series: coloredSeries, labels: drawLabels, theme }: ChartDrawArgs, { barLayout, isHorizontal, showGrid, axisLines, xTickFormatter, stackedData, topStackedKeyByAxis, roundStackEnds, barCornerRadius, barTrack, barShadow, barFillStyle, }: DrawBarChartStaticArgs): void;
export interface DrawBarHoverArgs {
    alpha: number;
    barCornerRadius: number;
    barTrack: boolean;
    isHorizontal: boolean;
}
/** Paint the resolved hover highlight. Track highlights draw a translucent full-extent rect; bar
 *  highlights draw a darker shade of the bar color. Clips to the pills from
 *  `resolveBarHoverItems` when rounding stack ends. */
export declare function drawBarHoverItems(ctx: CanvasRenderingContext2D, d3Scales: BarScaleSet, { items, hoveredBandPills }: ResolvedBarHover, { alpha, barCornerRadius, barTrack, isHorizontal }: DrawBarHoverArgs): void;
