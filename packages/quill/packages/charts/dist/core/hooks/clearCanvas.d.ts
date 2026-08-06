import { ChartDimensions } from '../types';
/** Reset the transform to device-pixel scale and clear the whole canvas, leaving the ctx in a
 *  saved state the caller restores after drawing. Shared by the static and hover draw loops.
 *
 *  The scale is derived from the backing store the canvas was actually sized with
 *  (`canvas.width / dimensions.width`) rather than a fresh `window.devicePixelRatio` read. A
 *  redraw can run at a different devicePixelRatio than the one that sized the backing (e.g. a
 *  headless export that resizes the viewport under device_scale_factor=2); reading it again here
 *  would scale the transform inconsistently with the canvas and magnify/clip the drawing. */
export declare function clearAndPrepare(ctx: CanvasRenderingContext2D, dimensions: ChartDimensions): void;
