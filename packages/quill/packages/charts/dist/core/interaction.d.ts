import { BandSlot, ChartDimensions, DragRect, PointClickData, ResolvedSeries, ResolveValueFn, TooltipContext, YAxisScale } from './types';
export type { DragRect } from './types';
export interface LabelPosition {
    x: number;
    index: number;
}
/** Builds the (x, index) lookup table for hit-testing. O(N) — call once per (labels, xScale) change
 *  and feed the result into {@link findNearestIndexFromPositions} on each mousemove. */
export declare function buildLabelPositions(labels: string[], xScale: (label: string) => number | undefined): LabelPosition[];
/** Binary search over precomputed positions. O(log N) per call. */
export declare function findNearestIndexFromPositions(mouseX: number, positions: LabelPosition[]): number;
export declare function findNearestIndex(mouseX: number, labels: string[], xScale: (label: string) => number | undefined): number;
export declare function isInPlotArea(mouseX: number, mouseY: number, dimensions: ChartDimensions): boolean;
/** Maps a drag selection to the spanned label range. A drag whose edges both snap to the same
 *  label selects that single bucket, provided it spans enough horizontal distance to read as
 *  intentional. Returns null when no labels are positioned or the drag is too narrow. */
export declare function dragRectToLabelRange(rect: DragRect, labelPositions: LabelPosition[]): {
    startIndex: number;
    endIndex: number;
} | null;
export declare function buildTooltipContext<Meta = unknown>(dataIndex: number, series: ResolvedSeries<Meta>[], labels: string[], xScale: (label: string) => number | undefined, yScale: (value: number) => number, canvasBounds: DOMRect, resolveValue: ResolveValueFn, yAxes?: Record<string, YAxisScale>, 
/** Returned `position.{x,y}` are canvas-pixel coordinates regardless of orientation. */
interactionAxis?: 'x' | 'y', hoverPosition?: {
    x: number;
    y: number;
} | null, 
/** Resolves the value used to *anchor* the tooltip per series. Defaults to `resolveValue`.
 *  Stacked charts pass the stacked-top resolver here so the anchor lands at the visual top
 *  of each segment while each tooltip row still shows its own value via `resolveValue`. */
resolvePositionValue?: ResolveValueFn, 
/** Resolves the stacked *bottom* value for each series. When provided, yPixelBottom is
 *  stored alongside yPixel so findClosestSeriesKey can use range containment rather than
 *  distance — cursor inside [yPixel, yPixelBottom] wins exactly at the segment boundary. */
resolveBottomValue?: ResolveValueFn, 
/** Optional horizontal data-extent centered on the categorical axis position — bar charts
 *  pass band width so the tooltip can anchor at the band edge instead of its center. */
positionExtent?: number, 
/** Optional per-bar anchor for grouped layouts — overrides the band-axis center and extent
 *  so the tooltip anchors on the hovered bar rather than the whole group. */
bandSlot?: BandSlot): TooltipContext<Meta> | null;
export declare function buildPointClickData<Meta = unknown>(dataIndex: number, series: ResolvedSeries<Meta>[], labels: string[], resolveValue: ResolveValueFn, cursor: {
    x: number;
    y: number;
} | null): PointClickData<Meta> | null;
