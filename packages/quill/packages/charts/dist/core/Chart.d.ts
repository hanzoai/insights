import { default as React } from 'react';
import { AreaSelectData, ChartConfig, ChartDrawArgs, ChartScales, ChartTheme, CreateScalesFn, DateRangeZoomData, DrawHoverResult, PointClickData, ResolveValueFn, Series, TooltipContext } from './types';
export interface ChartProps<Meta = unknown> {
    series: Series<Meta>[];
    labels: string[];
    config?: ChartConfig;
    theme: ChartTheme;
    createScales: CreateScalesFn;
    /** Static layer — grid, lines, areas, points. Redrawn only when chart inputs change. */
    drawStatic: (args: ChartDrawArgs) => void;
    /** Hover overlay — highlight rings only. Return `false` if nothing was drawn (the
     *  hover-fade timer pauses while invisible). */
    drawHover: (args: ChartDrawArgs) => DrawHoverResult;
    tooltip?: (ctx: TooltipContext<Meta>) => React.ReactNode;
    onPointClick?: (data: PointClickData<Meta>) => void;
    /** Enables x-axis drag-to-zoom. Fired with the label range the user dragged across.
     *  x-axis only — has no effect on charts with a vertical (`interactionAxis: 'y'`) interaction. */
    onDateRangeZoom?: (data: DateRangeZoomData) => void;
    /** Enables a 2D brush: the drag tracks both axes, the selection rect clamps to the dragged
     *  vertical range, and the completed gesture reports the x label range plus the y pixel
     *  span, with the committed `scales` so chart-type adapters can map pixels onto their own
     *  bands. Takes precedence over `onDateRangeZoom`. Chart-type adapters provide this and
     *  expose a domain-shaped callback (e.g. Heatmap's `onBrush`); consumers do not. */
    onAreaSelect?: (data: AreaSelectData, scales: ChartScales) => void;
    className?: string;
    dataAttr?: string;
    children?: React.ReactNode;
    /** Resolves the y-value to *display* for a series at a given index. Defaults to
     *  series.data[index]. Identity is read live for tooltip values, but the pinned-tooltip
     *  rebuild only refires when `series`, `labels`, or `scales` change. Callers that
     *  derive values from data not reflected in those (e.g. an external "%" toggle)
     *  should ensure that toggle also updates `series` or the chart's scales — otherwise
     *  a held pin will keep showing values from the previous resolver. */
    resolveValue?: ResolveValueFn;
    /** Value used to *anchor* the tooltip and value-label overlays per series. Defaults to
     *  `resolveValue`. Stacked charts pass the stacked-top resolver here so overlays land at the
     *  visual top of each segment, while each tooltip row still shows that series's own value
     *  via `resolveValue`. */
    resolvePositionValue?: ResolveValueFn;
    /** Resolves the stacked bottom value per series — used to compute segment midpoints for
     *  tooltip closest-series detection. Only bar charts provide this. */
    resolveBottomValue?: ResolveValueFn;
    /** Required for horizontal orientation — maps labels to the coordinate on the categorical
     *  axis (y in horizontal mode). Should be referentially stable; non-stable identities
     *  invalidate the interaction memo on every render. */
    labelToCoord?: (label: string) => number | undefined;
    /** Override the series fed into value-axis tick sizing (`useChartMargins`). Use when the
     *  visible series's `data[i]` doesn't span the y-domain — e.g. BoxPlot passes synthetic
     *  whisker min/max samples so the y-tick column fits the real value range, not just the
     *  medians it draws on `series.data`. */
    valueRangeSeries?: Series[];
    /** Chart-type seam: rewrite the click payload (e.g. resolve the stacked segment under the
     *  cursor) before it reaches `onPointClick`, using the committed `scales` from this render.
     *  Chart-type adapters provide this; consumers do not. */
    wrapClickData?: (data: PointClickData<Meta>, scales: ChartScales) => PointClickData<Meta>;
    /** Chart-type seam: given the nearest band index and cursor, return the effective hover index — or
     *  -1 to make the position a dead zone (no tooltip, pointer cursor, highlight, or click). Chart-type
     *  adapters provide this; BarChart uses it for a capped track's blank volume gap. */
    resolveHoverIndex?: (index: number, cursor: {
        x: number;
        y: number;
    }, scales: ChartScales) => number;
}
export declare function Chart<Meta = unknown>({ series, labels, config, theme, createScales: createScalesFn, drawStatic, drawHover, tooltip: renderTooltipProp, onPointClick, onDateRangeZoom, onAreaSelect, className, dataAttr, children, resolveValue, resolvePositionValue, resolveBottomValue, labelToCoord, valueRangeSeries, wrapClickData, resolveHoverIndex, }: ChartProps<Meta>): React.ReactElement;
