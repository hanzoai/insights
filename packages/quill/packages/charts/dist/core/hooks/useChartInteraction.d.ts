import { default as React } from 'react';
import { AreaSelectData, ChartDimensions, ChartScales, DateRangeZoomData, DragRect, PointClickData, ResolvedSeries, ResolveValueFn, TooltipContext } from '../types';
interface UseChartInteractionOptions<Meta> {
    scales: ChartScales | null;
    dimensions: ChartDimensions | null;
    labels: string[];
    series: ResolvedSeries<Meta>[];
    canvasRef: React.RefObject<HTMLCanvasElement>;
    wrapperRef: React.RefObject<HTMLDivElement>;
    showTooltip: boolean;
    pinnable: boolean;
    /** See `TooltipConfig.resolveClickToNearestSeries`. */
    resolveClickToNearestSeries?: boolean;
    onPointClick?: (data: PointClickData<Meta>) => void;
    onDateRangeZoom?: (data: DateRangeZoomData) => void;
    /** 2D brush — see `ChartProps.onAreaSelect`. Receives the committed `scales` so chart-type
     *  adapters can map the y pixel range onto their own bands. */
    onAreaSelect?: (data: AreaSelectData, scales: ChartScales) => void;
    resolveValue?: ResolveValueFn;
    /** Value used to *anchor* the tooltip per series. Defaults to `resolveValue`. Stacked
     *  charts pass the stacked-top resolver so the anchor lands at the visual top of each
     *  segment while each tooltip row still shows its own value via `resolveValue`. */
    resolvePositionValue?: ResolveValueFn;
    /** Resolves the stacked bottom value per series — passed to buildTooltipContext so yPixel
     *  is set to the segment midpoint, making closest-series detection match the visual boundary. */
    resolveBottomValue?: ResolveValueFn;
    interactionAxis?: 'x' | 'y';
    labelToCoord?: (label: string) => number | undefined;
    /** Chart-type seam: rewrite the click payload (e.g. resolve the stacked segment under the
     *  cursor) before it reaches `onPointClick`, using the committed `scales` from this render.
     *  Chart-type adapters provide this; consumers do not. */
    wrapClickData?: (data: PointClickData<Meta>, scales: ChartScales) => PointClickData<Meta>;
    /** Chart-type seam: given the nearest band index and the cursor, return the effective hover index —
     *  or -1 to treat the position as a dead zone (no tooltip, pointer cursor, highlight, or click).
     *  BarChart uses it to make a capped track's blank volume gap inert. Adapters provide this. */
    resolveHoverIndex?: (index: number, cursor: {
        x: number;
        y: number;
    }, scales: ChartScales) => number;
}
interface UseChartInteractionResult<Meta> {
    hoverIndex: number;
    hoverPosition: {
        x: number;
        y: number;
    } | null;
    tooltipCtx: TooltipContext<Meta> | null;
    dragRect: DragRect | null;
    handlers: {
        onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
        onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
        onMouseLeave: () => void;
        onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    };
}
export declare function useChartInteraction<Meta = unknown>({ scales, dimensions, labels, series, canvasRef, wrapperRef, showTooltip, pinnable, resolveClickToNearestSeries, onPointClick, onDateRangeZoom, onAreaSelect, resolveValue, resolvePositionValue, resolveBottomValue, interactionAxis, labelToCoord, wrapClickData, resolveHoverIndex, }: UseChartInteractionOptions<Meta>): UseChartInteractionResult<Meta>;
export {};
