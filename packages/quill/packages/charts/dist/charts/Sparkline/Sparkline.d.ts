import { default as React } from 'react';
import { ChartTheme, Series, TooltipContext } from '../../core/types';
export interface SparklineProps {
    /** Single-series values. Ignored when `series` is provided. */
    data?: number[];
    /** Multi-series form with full per-series control (color, fill, stroke). Bars render stacked.
     *  When set, the single-series conveniences (`data`, `color`, `fillOpacity`,
     *  `dashedFromIndex`) are ignored — express them on the series entries instead. */
    series?: Series[];
    /** Optional x-axis labels — when omitted, indices stand in. Consumers can look up
     *  the hovered index against their own labels. */
    labels?: string[];
    theme: ChartTheme;
    color?: string;
    /** `line` (default) draws a gradient-filled trend line; `bar` draws stacked bars. */
    type?: 'line' | 'bar';
    height?: number;
    /** Fill the parent's height (flex child) instead of using a fixed `height`. */
    fill?: boolean;
    /** Peak opacity of the gradient fill under the line. Range 0–1. */
    fillOpacity?: number;
    /** Dash the line from this index onward (e.g. an in-progress trailing period). Omit for a fully solid line. */
    dashedFromIndex?: number;
    /** Fires the hovered index, or -1 when not hovering. */
    onHoverIndexChange?: (index: number) => void;
    /** Tooltip content renderer. Sparkline tooltips are off by default; supplying this enables them. */
    tooltip?: (ctx: TooltipContext) => React.ReactNode;
    className?: string;
    dataAttr?: string;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}
export declare function Sparkline(props: SparklineProps): React.ReactElement;
