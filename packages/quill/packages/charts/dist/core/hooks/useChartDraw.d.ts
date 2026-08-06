import { ChartDimensions, ChartDrawArgs, ChartScales, ChartTheme, DragRect, DrawHoverResult, ResolvedSeries } from '../types';
interface UseChartDrawOptions {
    /** Context for the static layer (grid, lines, areas, points). Redrawn only when chart inputs change. */
    ctx: CanvasRenderingContext2D | null;
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
    drawStatic: (args: ChartDrawArgs) => void;
    drawHover: (args: ChartDrawArgs) => DrawHoverResult;
    /** Duration (ms) of the hover-overlay fade-in/out. `0` disables. */
    hoverAnimationMs?: number;
}
export declare function useChartDraw({ ctx, overlayCtx, dimensions, scales, series, labels, hoverIndex, hoverPosition, theme, dragRect, drawStatic, drawHover, hoverAnimationMs, }: UseChartDrawOptions): void;
export {};
