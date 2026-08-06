import { ChartDimensions, ChartMargins } from './types';
/** The subset of `DOMRect` the canvas sizing needs. */
export interface SizeRect {
    width: number;
    height: number;
}
/** Size a canvas to `rect` at `dpr`, touching `width`/`height` only when they actually change.
 *  Returns whether the backing store was reallocated — i.e. whether the bitmap was wiped and a
 *  repaint is now mandatory.
 *
 *  Assigning `canvas.width` or `canvas.height` resets the bitmap to transparent black — even when
 *  the assigned value is identical to the current one. The draw loops repaint on the *next*
 *  animation frame, so every redundant assignment costs one fully blank painted frame, and a
 *  container that keeps reporting resizes (a scrollbar appearing and disappearing on an
 *  `overflow: auto` ancestor, an animating panel) wipes the bitmap faster than it is repainted —
 *  the chart reads as blank while its DOM axis labels keep rendering. `ResizeObserver` also
 *  delivers an initial observation on top of the synchronous first measure, so the redundant case
 *  happens on every mount. */
export declare function syncCanvasSize(canvas: HTMLCanvasElement, rect: SizeRect, dpr: number): boolean;
export declare function buildDimensions(rect: SizeRect, margins: ChartMargins): ChartDimensions;
export declare function sameDimensions(a: ChartDimensions, b: ChartDimensions): boolean;
