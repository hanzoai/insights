import { default as React } from 'react';
import { ChartTheme, ResolvedSeries, Series } from './types';
/** Applies the theme's color fallback to series missing an explicit `color`. */
export declare function useColoredSeries<Meta = unknown>(series: Series<Meta>[], theme: ChartTheme): ResolvedSeries<Meta>[];
export declare function useCanvasBounds(canvasRef: React.RefObject<HTMLCanvasElement>): () => DOMRect | null;
export declare const countVisibleSeries: (series: ResolvedSeries[]) => number;
export interface ChartShellProps {
    wrapperRef: React.RefObject<HTMLDivElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
    className?: string;
    dataAttr?: string;
    /** Show the pointer cursor — the hovered element is clickable. Takes precedence over `crosshair`. */
    pointer: boolean;
    /** Show the crosshair cursor — a drag gesture (e.g. drag-to-zoom) is available. */
    crosshair?: boolean;
    ariaLabel: string;
    handlers: Required<Pick<React.DOMAttributes<HTMLDivElement>, 'onMouseMove' | 'onMouseLeave' | 'onClick'>> & Pick<React.DOMAttributes<HTMLDivElement>, 'onMouseDown'>;
    /** Render the overlay layer — bases gate this on layout readiness (dimensions + scales). */
    showOverlay: boolean;
    children?: React.ReactNode;
}
/** Shared DOM shell of the chart bases — behavior (interaction, drawing, contexts) stays in the bases. */
export declare function ChartShell({ wrapperRef, canvasRef, overlayCanvasRef, className, dataAttr, pointer, crosshair, ariaLabel, handlers, showOverlay, children, }: ChartShellProps): React.ReactElement;
