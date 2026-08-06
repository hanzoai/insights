import { ChartDimensions, ChartMargins } from '../types';
interface UseChartCanvasOptions {
    margins: ChartMargins;
}
interface UseChartCanvasResult {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
    wrapperRef: React.RefObject<HTMLDivElement>;
    dimensions: ChartDimensions | null;
    ctx: CanvasRenderingContext2D | null;
    overlayCtx: CanvasRenderingContext2D | null;
}
export declare function useChartCanvas(options: UseChartCanvasOptions): UseChartCanvasResult;
export {};
