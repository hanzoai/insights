import { ChartDimensions, ChartDrawArgs, ChartScales, ChartTheme, DragRect, DrawHoverResult, ResolvedSeries } from '../types';
interface UseHoverAnimationOptions {
    /** Context for the hover overlay (highlight rings). Redrawn on every hoverIndex change. */
    overlayCtx: CanvasRenderingContext2D | null;
    dimensions: ChartDimensions | null;
    scales: ChartScales | null;
    series: ResolvedSeries[];
    labels: string[];
    hoverIndex: number;
    hoverPosition: {
        x: number;
        y: number;
    } | null;
    theme: ChartTheme;
    dragRect?: DragRect | null;
    drawHover: (args: ChartDrawArgs) => DrawHoverResult;
    /** Duration (ms) of the hover-overlay fade-in. `0` snaps instantly. */
    hoverAnimationMs: number;
}
/**
 * Drives the hover overlay's fade-in on its own RAF loop. The highlight eases in (progress 0→1)
 * when the cursor enters a band and cross-fades when it moves between bands. The overlay clears
 * when the cursor leaves (hoverIndex < 0).
 */
export declare function useHoverAnimation({ overlayCtx, dimensions, scales, series, labels, hoverIndex, hoverPosition, theme, dragRect, drawHover, hoverAnimationMs, }: UseHoverAnimationOptions): void;
export {};
