import { default as React } from 'react';
import { ChartMargins, ChartTheme, TooltipContext } from '../../core/types';
import { HeatmapColorScale } from './heatmap-layout';
/** Meta attached to the adapter series the Heatmap hands to the base `Chart` — one series
 *  per row, carrying its row index so tooltip/click code can map back to the grid. */
export interface HeatmapRowMeta {
    rowIndex: number;
}
/** Tooltip context handed to consumer-supplied `tooltip` callbacks — `TooltipContext` with
 *  the row meta baked in. Each `seriesData` entry is one row at the hovered column; use
 *  `findClosestSeriesKey(ctx.seriesData, ctx.hoverPosition.y)` (as the built-in tooltip does)
 *  to narrow to the single hovered cell. */
export type HeatmapTooltipContext = TooltipContext<HeatmapRowMeta>;
export interface HeatmapConfig {
    /** Custom x-axis tick label formatter. Return null to skip a tick. Called with (label, index). */
    xTickFormatter?: (label: string, index: number) => string | null;
    /** How counts map to color intensity. Defaults to 'log' — right for long-tailed count grids. */
    colorScale?: HeatmapColorScale;
    /** Accent color for the density ramp (hex, rgb, or var(--…)). Defaults to the first theme
     *  palette color. */
    color?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    hideXAxis?: boolean;
    hideYAxis?: boolean;
    /** Per-side margin overrides. Should be referentially stable. */
    margins?: Partial<ChartMargins>;
    tooltip?: {
        /** Show the single-cell tooltip on hover. Defaults to true. */
        enabled?: boolean;
        /** Formats the column (x) label in the tooltip header. */
        labelFormatter?: (label: string) => React.ReactNode;
        /** Formats the cell count. Defaults to `toLocaleString`. */
        valueFormatter?: (value: number) => React.ReactNode;
    };
}
/** Inclusive index ranges of a completed 2D brush, in grid coordinates. */
export interface HeatmapBrushData {
    /** Column range into `xLabels`. */
    x: {
        startIndex: number;
        endIndex: number;
    };
    /** Row range into `yLabels` (0 = bottom row). */
    y: {
        startIndex: number;
        endIndex: number;
    };
}
export interface HeatmapCellDatum {
    /** Column index into `xLabels`. */
    xIndex: number;
    /** Row index into `yLabels` (0 = bottom row). */
    yIndex: number;
    xLabel: string;
    yLabel: string;
    /** The cell's count. */
    value: number;
}
export interface HeatmapProps {
    /** Column labels, left to right. */
    xLabels: string[];
    /** Row labels, bottom to top — `yLabels[0]` is the bottom row (smallest bucket). */
    yLabels: string[];
    /** Dense grid of counts: `cells[rowIndex][colIndex]`, aligned with `yLabels`/`xLabels`.
     *  0 (or a missing entry) means an empty cell — nothing is drawn there. */
    cells: number[][];
    theme: ChartTheme;
    config?: HeatmapConfig;
    /** Custom tooltip. Each `ctx.seriesData` entry is one row at the hovered column; narrow to
     *  the hovered cell via `findClosestSeriesKey(ctx.seriesData, ctx.hoverPosition.y)`. */
    tooltip?: (ctx: HeatmapTooltipContext) => React.ReactNode;
    /** Fired when the user clicks a cell. */
    onCellClick?: (cell: HeatmapCellDatum) => void;
    /** Enables the 2D brush: drag a rectangle to select a column range and a row range at once.
     *  A near-horizontal drag (under ~8px of vertical travel) selects every row, so a sloppy
     *  time-range drag doesn't pin the selection to one bucket sliver. */
    onBrush?: (selection: HeatmapBrushData) => void;
    className?: string;
    dataAttr?: string;
    children?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}
export declare function Heatmap({ onError, ...rest }: HeatmapProps): React.ReactElement;
