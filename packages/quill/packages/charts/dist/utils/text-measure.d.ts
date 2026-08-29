export declare const FONT_FAMILY = "Zen, -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", Helvetica, Arial, sans-serif";
export declare const AXIS_LABEL_FONT = "12px Zen, -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", Helvetica, Arial, sans-serif";
export declare const ELLIPSIS = "\u2026";
/** Largest pixel width a category (breakdown) tick label may occupy before it's truncated
 *  with an ellipsis. Without this, long breakdown values — most notably URLs — grow the axis
 *  margin to fit the widest label and push the plot off screen. */
export declare const MAX_CATEGORY_LABEL_WIDTH = 160;
export declare function getTextMeasureCtx(): CanvasRenderingContext2D | null;
/** Falls back to length × 7 when the canvas context is unavailable (SSR). */
export declare function measureLabelWidth(text: string, font?: string): number;
/** Truncate `text` with a trailing ellipsis so its rendered width fits within `maxWidth`.
 *  Returns the original string when it already fits, or when `maxWidth` is non-positive. */
export declare function truncateToWidth(text: string, maxWidth: number, font?: string): string;
