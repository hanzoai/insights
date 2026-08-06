import { ChartDimensions } from '../../core/types';
/** How cell counts map to color intensity. `log` (default) uses log1p normalization —
 *  latency/count grids are long-tailed, and a linear ramp washes out everything but the mode. */
export type HeatmapColorScale = 'log' | 'linear';
/** Uniform grid layout of the heatmap plot area. Rows index bottom-to-top: row 0 is the
 *  bottom row, matching an ascending value axis (smallest bucket at the bottom). */
export interface HeatmapLayout {
    cols: number;
    rows: number;
    colWidth: number;
    rowHeight: number;
    plotLeft: number;
    plotTop: number;
    plotWidth: number;
    plotHeight: number;
}
export declare function computeHeatmapLayout(dimensions: ChartDimensions, cols: number, rows: number): HeatmapLayout;
export interface CellRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
/** Pixel rect of the cell at (colIndex, rowIndex). Row 0 is the bottom row. */
export declare function cellRect(layout: HeatmapLayout, colIndex: number, rowIndex: number): CellRect;
/** Row index under a canvas y pixel, or -1 outside the plot. Row 0 is the bottom row. */
export declare function rowAtY(layout: HeatmapLayout, y: number): number;
/** Like `rowAtY`, but pixels beyond the plot clamp to the edge rows — for gestures (brush
 *  releases) that legitimately end outside the plot area. */
export declare function rowAtYClamped(layout: HeatmapLayout, y: number): number;
export declare function maxCellValue(cells: number[][]): number;
/** Normalize a count to [0, 1] against the grid maximum. Zero/absent counts and an
 *  all-zero grid map to 0 — callers skip drawing those cells entirely. */
export declare function normalizeCount(count: number, max: number, scale: HeatmapColorScale): number;
/** A cell-fill ramp bound to one accent: maps a normalized intensity [0, 1] to a translucent
 *  fill (an alpha ramp over the accent), so density reads on light and dark without extra theme
 *  tokens. Memoizes by 8-bit alpha — canvas can't resolve finer, and the draw loop hits the same
 *  intensities across hundreds of cells, so the accent is parsed at most 256 times per draw
 *  instead of once per cell. */
export declare function createCellColorRamp(accent: string): (t: number) => string;
