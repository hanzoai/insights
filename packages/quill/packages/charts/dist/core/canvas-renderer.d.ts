import { ScaleLinear, ScaleLogarithmic } from 'd3-scale';
import { BarFillStyle, BoxRect, ChartDimensions, ChartDrawArgs, ChartTheme, DrawHoverResult, ResolvedSeries } from './types';
export interface DrawContext {
    ctx: CanvasRenderingContext2D;
    dimensions: ChartDimensions;
    xScale: (label: string) => number | undefined;
    yScale: ScaleLinear<number, number> | ScaleLogarithmic<number, number>;
    labels: string[];
    /** Smooth the line/area with monotone-cubic interpolation instead of straight segments. */
    smooth?: boolean;
    /** Largest drawable y (px) for line/area strokes. Charts drawing an x-axis line pass the
     *  baseline minus half their stroke width, so a baseline-hugging stroke rests exactly on the
     *  axis line instead of straddling it. Pure draw-time clamp — scales and ticks are untouched. */
    yFloor?: number;
}
/** Stroke width of series lines. Half of it is the stroke's overhang past a point, which the
 *  `yFloor`/left-clip callers use to keep strokes flush against drawn axis lines. */
export declare const LINE_STROKE_WIDTH = 2;
export declare function drawLine(drawCtx: DrawContext, series: ResolvedSeries, yValues?: number[]): void;
export declare function drawArea(drawCtx: DrawContext, series: ResolvedSeries, yValues?: number[], bottomValues?: number[]): void;
export declare function drawPoints(drawCtx: DrawContext, series: ResolvedSeries, yValues?: number[]): void;
/** The stroke color for axis lines and tick marks — separate from `axisColor` (tick-label text)
 *  so hosts can mute the lines without muting the labels. One place, so the precedence can't
 *  drift between call sites. */
export declare function resolveAxisLineColor(theme: ChartTheme): string | undefined;
export interface DrawAxesOptions {
    axisColor?: string;
    /** Stroke the bottom (x) baseline. Default true. */
    xLine?: boolean;
    /** Stroke the left (y) baseline. Default true. */
    yLine?: boolean;
    /** Also stroke the right plot edge — for charts with a right-positioned y-axis. Gated on `yLine`. */
    rightAxis?: boolean;
}
/** Draws just the L-shaped axis baselines — the left value axis and the bottom category axis —
 *  without any interior grid lines. For charts that want axis framing but a clean, grid-free plot. */
export declare function drawAxes(drawCtx: DrawContext, options?: DrawAxesOptions): void;
/** Length (px) of an axis tick mark, measured outward from the plot edge. */
export declare const TICK_MARK_LENGTH = 4;
/** Pixel positions for canvas tick marks: `xs` tick below the plot's bottom edge, `ys` tick outside
 *  the left or right plot edge (`offset` pushes stacked multi-axis gutters further outward). */
export interface TickMarkCoords {
    xs: number[];
    ys: {
        y: number;
        side: 'left' | 'right';
        offset: number;
    }[];
}
/** Draws short tick marks extending outward from the plot edges, one per visible axis label.
 *  Canvas-drawn with the same snapping as `drawAxes`/`drawGrid` so each tick continues its
 *  axis/grid line exactly — a DOM overlay can't guarantee that across subpixel rounding. */
export declare function drawTickMarks(ctx: CanvasRenderingContext2D, dimensions: ChartDimensions, coords: TickMarkCoords, color?: string): void;
export interface DrawGridOptions {
    gridColor?: string;
    /** Canvas dash pattern (e.g. `[3, 3]`) for the interior grid lines. Solid when omitted.
     *  The plot-edge baseline strokes stay solid either way — only the interior lines dash. */
    gridDash?: number[];
    /** Draw the solid plot-edge baseline strokes framing the grid (both value-axis edges).
     *  Defaults to true. Charts drawing their own axis lines pass false — the L-axis replaces the
     *  near baseline, and the far one would read as a stray border. */
    frame?: boolean;
    orientation?: 'vertical' | 'horizontal';
    /** Cross-axis grid line positions (x-pixels in vertical mode, y-pixels in horizontal). */
    categoryTicks?: number[];
}
/** Draws the grid lines and the full plot-area frame.
 *
 * `orientation`:
 *  - `'vertical'` (default): horizontal grid lines at value-axis (y) tick positions, vertical baselines on both left and right.
 *  - `'horizontal'`: vertical grid lines at value-axis (x) tick positions, horizontal baselines on both top and bottom.
 *
 * In both modes, `yScale` maps a value to a pixel on the value axis — for vertical that's a y-pixel,
 * for horizontal that's an x-pixel. The function uses `dimensions` to size the perpendicular axis.
 */
export declare function drawGrid(drawCtx: DrawContext, options?: DrawGridOptions): void;
export declare function drawCrosshair(ctx: CanvasRenderingContext2D, dimensions: ChartDimensions, coord: number, color: string, orientation?: 'vertical' | 'horizontal', dash?: number[]): void;
export interface BarRoundedCorners {
    topLeft?: boolean;
    topRight?: boolean;
    bottomLeft?: boolean;
    bottomRight?: boolean;
}
/** Caller owns beginPath / fill / stroke; this only emits the path. */
export declare function traceRoundedBarPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, corners: BarRoundedCorners): void;
export interface BarRect {
    x: number;
    y: number;
    width: number;
    height: number;
    corners: BarRoundedCorners;
    /** Index into the original `series.data` — partial-dash hatch ranges resolve against the
     *  source array, not against this bars[] which the caller may have pre-filtered. */
    dataIndex: number;
}
export declare const DEFAULT_BAR_CORNER_RADIUS = 4;
/** d3 `.darker()` factor for a bar's hover highlight — shared by BarChart and ComboChart so the
 *  hovered-bar shade stays consistent. */
export declare const BAR_HIGHLIGHT_DARKEN = 0.6;
/** Run `draw` with the canvas clipped to the plot area vertically (full width, padded `pad` px top
 *  and bottom). Keeps out-of-domain values (e.g. a trendline below 0) out of the axis gutters while
 *  leaving the left/right edges unclipped so line caps and edge point markers render whole.
 *  `clipLeft` additionally trims at the plot's left edge — for charts drawing a y-axis line, so the
 *  first point's stroke ends at the axis instead of bulging past it into the gutter. Shared by
 *  LineChart and ComboChart. `restore` always runs, even if `draw` throws. */
export declare function withVerticalClip(ctx: CanvasRenderingContext2D, dimensions: ChartDimensions, draw: () => void, pad?: number, clipLeft?: boolean): void;
export interface LineSeriesLayerOptions {
    ctx: CanvasRenderingContext2D;
    dimensions: ChartDimensions;
    labels: string[];
    /** Series to draw, in paint order. Excluded series are skipped. */
    series: readonly ResolvedSeries[];
    xScale: (label: string) => number | undefined;
    resolveYScale: (s: ResolvedSeries) => ScaleLinear<number, number> | ScaleLogarithmic<number, number>;
    /** y-values to plot for a series (e.g. stacked tops). Defaults to `series.data`. */
    yValuesFor?: (s: ResolvedSeries) => number[] | undefined;
    /** Bottom edge for the area fill (stacked bottom or `fill.lowerData`). */
    bottomFor?: (s: ResolvedSeries) => number[] | undefined;
    /** Whether to fill the area under a series. Defaults to `!!s.fill`. */
    shouldFill?: (s: ResolvedSeries) => boolean;
    /** `per-series`: area then line+points per series (LineChart). `areas-first`: every area, then
     *  every line+points (ComboChart) so a later area can't paint over an earlier line. */
    zOrder?: 'per-series' | 'areas-first';
    /** Smooth lines/areas with monotone-cubic interpolation instead of straight segments. */
    smooth?: boolean;
    /** See {@link DrawContext.yFloor} — rest baseline-hugging strokes on the axis line. */
    yFloor?: number;
    /** Trim strokes at the plot's left edge so they end at a drawn y-axis line instead of bulging
     *  past it. Pass the chart's `showAxisLines` — without an axis line the overhang is invisible
     *  and edge line caps are left whole. */
    clipLeftEdge?: boolean;
}
/** Draw a line/area layer (clipped vertically) — the per-series area/line/points orchestration shared
 *  by LineChart and ComboChart. Callers supply the y-value source (raw vs stacked tops), the fill
 *  predicate, and the z-order; the loop, clip, and primitive calls live here. */
export declare function drawLineSeriesLayer(options: LineSeriesLayerOptions): void;
/** Draw hover highlight rings for line/area series at the hovered index. Skips excluded,
 *  fill-between (`fill.lowerData`), and overlay series (trendlines/moving averages opt out of hover
 *  points). `pointFor` lets each chart supply its own anchor — LineChart resolves the point x and
 *  stacked-top y per series; ComboChart anchors at the band center with raw values. Returns whether
 *  any point was drawn. Shared by LineChart and ComboChart. */
export declare function drawLineHoverPoints(ctx: CanvasRenderingContext2D, series: readonly ResolvedSeries[], backgroundColor: string, pointFor: (s: ResolvedSeries) => {
    x: number;
    y: number;
} | null): boolean;
export interface BarShadow {
    color: string;
    blur: number;
    offsetX?: number;
    offsetY?: number;
}
/** Hatch ranges (`series.stroke?.partial`) clamp against `series.data.length`. Any ctx
 *  state (shadow / clip / globalAlpha) is the caller's responsibility. */
export declare function drawBars(drawCtx: DrawContext, series: ResolvedSeries, bars: BarRect[], cornerRadius?: number, fillStyle?: BarFillStyle): void;
/** Translucent overlay drawn over the track on hover. Exported so the chart-type's
 *  hover callback can match the resting track's tuning. */
export declare const BAR_TRACK_HOVER_ALPHA = 0.2;
/** Clips subsequent drawing to the union of the given rounded rects — used to mask the bar
 *  layer to the funnel pill so a stack's outer corners round even when the edge segment is too
 *  thin to round on its own. Caller owns save/restore. */
export declare function clipToRoundedRects(ctx: CanvasRenderingContext2D, rects: BarRect[], cornerRadius: number): void;
/** Paints each track rect as a single solid colour — the neutral "remainder of the whole"
 *  backdrop for funnel-style stacked bars (one track per band behind the stack), as opposed
 *  to {@link drawBarTracks}'s per-series tinted+hatched treatment for grouped layouts. */
export declare function drawSolidBarTracks(ctx: CanvasRenderingContext2D, tracks: BarRect[], color: string, cornerRadius: number): void;
/** Paints each track rect as a tinted base under hatched stripes. Takes laid-out rects
 *  from `computeBarTrackRect`, mirroring `drawBars`. */
export declare function drawBarTracks(drawCtx: DrawContext, series: ResolvedSeries, tracks: BarRect[], cornerRadius: number): void;
/** Translucent fill on the overlay canvas, alpha-composited over the static bar. */
export declare function drawBarHighlight(ctx: CanvasRenderingContext2D, bar: BarRect, overlayColor: string, cornerRadius?: number): void;
export declare function drawHighlightPoint(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, backgroundColor: string, radius?: number): void;
export interface DrawBoxOptions {
    /** Series base color — used for the box outline, whisker, median, and mean stroke. */
    color: string;
    /** Box fill — typically the series color at reduced alpha. */
    fillColor: string;
    /** Optional explicit median stroke color. Defaults to `color`. */
    medianColor?: string;
    /** Optional mean marker fill. Defaults to `fillColor`. */
    meanFillColor?: string;
    /** Mean marker radius in CSS pixels. Defaults to 3. */
    meanRadius?: number;
    /** Line width for the box outline, whiskers, and median. Defaults to 1.5. */
    lineWidth?: number;
    /** Width of the whisker caps (as a fraction of the box width). Defaults to 0.6. */
    whiskerCapRatio?: number;
}
/** Paint a whole series of box-and-whiskers, batching path operations so the number of
 *  `beginPath`/`stroke` pairs is `4 + N` instead of `5N` (whisker stems, caps, box outlines,
 *  and medians are each one shared path; mean markers stay per-box since each needs both
 *  fill and stroke). Pure: takes pre-laid-out {@link BoxRect}s; no scale access. */
export declare function drawBoxes(ctx: CanvasRenderingContext2D, boxes: BoxRect[], options: DrawBoxOptions): void;
/** Translucent highlight overlay for a hovered box. Drawn on the overlay canvas so it
 *  composites over the static box without disturbing it — mirrors {@link drawBarHighlight}. */
export declare function drawBoxHighlight(ctx: CanvasRenderingContext2D, box: BoxRect, overlayColor: string): void;
type DrawHoverFn = (args: ChartDrawArgs) => DrawHoverResult;
interface ComposeDrawHoverOptions {
    crosshairColor: string | undefined;
    crosshairDash?: number[];
    showCrosshair: boolean;
    axisOrientation?: 'vertical' | 'horizontal';
    labelToCoord?: (label: string) => number | undefined;
}
export declare function composeDrawHoverWithCrosshair(getDrawHover: () => DrawHoverFn, options: ComposeDrawHoverOptions): DrawHoverFn;
export declare function drawSelectionRect(ctx: CanvasRenderingContext2D, rect: {
    x: number;
    y: number;
    width: number;
    height: number;
}): void;
export declare function composeDrawHoverWithSelection(baseDrawHover: DrawHoverFn): DrawHoverFn;
export {};
