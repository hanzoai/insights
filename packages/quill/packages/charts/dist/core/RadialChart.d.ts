import { default as React } from 'react';
import { RadialSlicePayload } from './hooks/useRadialInteraction';
import { PieLayout } from './radial-layout';
import { ChartDrawArgs, ChartMargins, ChartTheme, DrawHoverResult, ResolvedSeries, Series, TooltipContext } from './types';
/** Near-zero margins — the radial chart computes center + radius from the full plot box and
 *  pulls the outer edge back via `radiusPadding`. The tiny pad here keeps slice strokes off
 *  the wrapper edge. */
export declare const RADIAL_MARGINS: ChartMargins;
/** Builds the geometry — and the matching ChartScales / RadialLayoutContext — from the
 *  current dimensions and resolved series. Pie/Donut variants supply their own builder. */
export type RadialLayoutBuilder<Meta = unknown> = (series: ResolvedSeries<Meta>[], dimensions: {
    plotLeft: number;
    plotTop: number;
    plotWidth: number;
    plotHeight: number;
}) => PieLayout<Meta>;
export interface RadialChartProps<Meta = unknown> {
    series: Series<Meta>[];
    theme: ChartTheme;
    buildLayout: RadialLayoutBuilder<Meta>;
    drawStatic: (args: ChartDrawArgs) => void;
    drawHover: (args: ChartDrawArgs) => DrawHoverResult;
    tooltip?: (ctx: TooltipContext<Meta>) => React.ReactNode;
    showTooltip?: boolean;
    onSliceClick?: (payload: RadialSlicePayload<Meta>) => void;
    /** Slack beyond `outerRadius` for hit-testing — typically the hover pop-out distance. */
    hitOuterSlack?: number;
    /** Duration (ms) of the hover-overlay transition. `0` disables (instant pop-out). */
    hoverAnimationMs?: number;
    className?: string;
    dataAttr?: string;
    children?: React.ReactNode;
}
export declare function RadialChart<Meta = unknown>({ series, theme, buildLayout, drawStatic, drawHover, tooltip: renderTooltipProp, showTooltip, onSliceClick, hitOuterSlack, hoverAnimationMs, className, dataAttr, children, }: RadialChartProps<Meta>): React.ReactElement;
