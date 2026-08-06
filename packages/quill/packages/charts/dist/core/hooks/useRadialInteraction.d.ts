import { default as React } from 'react';
import { PieLayout } from '../radial-layout';
import { ResolvedSeries, TooltipContext } from '../types';
export interface RadialSlicePayload<Meta = unknown> {
    sliceIndex: number;
    series: ResolvedSeries<Meta>;
    value: number;
    fraction: number;
}
interface UseRadialInteractionOptions<Meta> {
    layout: PieLayout<Meta> | null;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    wrapperRef: React.RefObject<HTMLDivElement>;
    showTooltip: boolean;
    onSliceClick?: (payload: RadialSlicePayload<Meta>) => void;
    /** Allowance beyond `outerRadius` for hit-testing so the grown slice still hovers.
     *  Typically equal to `hoverGrowth`. */
    hitOuterSlack?: number;
}
interface UseRadialInteractionResult<Meta> {
    hoverIndex: number;
    hoverPosition: {
        x: number;
        y: number;
    } | null;
    tooltipCtx: TooltipContext<Meta> | null;
    handlers: {
        onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
        onMouseLeave: () => void;
        onClick: () => void;
    };
}
export declare function useRadialInteraction<Meta = unknown>({ layout, canvasRef, wrapperRef, showTooltip, onSliceClick, hitOuterSlack, }: UseRadialInteractionOptions<Meta>): UseRadialInteractionResult<Meta>;
export {};
