import { default as React } from 'react';
import { LabelPosition } from '../interaction';
import { AreaSelectData, ChartDimensions, ChartScales, DateRangeZoomData, DragRect } from '../types';
interface UseDragToZoomOptions {
    onDateRangeZoom?: (data: DateRangeZoomData) => void;
    /** 2D brush: the drag also tracks the vertical range, the selection rect clamps to it, and
     *  the completed gesture reports the y pixel span alongside the label range. Takes
     *  precedence over `onDateRangeZoom` when both are set. */
    onAreaSelect?: (data: AreaSelectData) => void;
    scales: ChartScales | null;
    dimensions: ChartDimensions | null;
    labels: string[];
    labelPositions: LabelPosition[];
    wrapperRef: React.RefObject<HTMLDivElement>;
    /** Drag-to-zoom only operates on a horizontal x-axis; it's disabled when the chart's
     *  interaction axis is vertical. */
    interactionAxis?: 'x' | 'y';
    /** Fired once when a drag crosses the activation threshold (used to dismiss the hover tooltip). */
    onDragActivate: () => void;
}
interface UseDragToZoomResult {
    /** Live pixel range of the in-progress selection, or null when no drag is active. */
    dragRect: DragRect | null;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    /** Feed each mousemove's plot-relative coords. Returns true when the move was consumed by an
     *  active drag — the caller should then skip its own hover handling for this event. */
    handleMouseMove: (mouseX: number, mouseY: number) => boolean;
    /** Returns true when the click immediately follows a completed drag and should be swallowed. */
    shouldSwallowClick: () => boolean;
}
/** Drag-to-zoom gesture for the x-axis, factored out of `useChartInteraction`. Tracks a horizontal
 *  selection from mousedown to mouseup and emits the spanned label range via `onDateRangeZoom`. */
export declare function useDragToZoom({ onDateRangeZoom, onAreaSelect, scales, dimensions, labels, labelPositions, wrapperRef, interactionAxis, onDragActivate, }: UseDragToZoomOptions): UseDragToZoomResult;
export {};
