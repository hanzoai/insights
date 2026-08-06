import { ResolvedSeries } from '../../core/types';
/**
 * Of the visible series, the key whose y-pixel at the hovered index sits closest to the cursor —
 * so a multi-series line chart draws a single hover dot on the line under the cursor instead of a
 * column of rings across every series.
 *
 * Excluded series (legend-hidden), fill-between lower bounds, and overlays (moving averages, trend
 * lines, goal lines) are never candidates: in percent-stack mode their raw values ring far off-plot,
 * and they aren't the line the user is pointing at. `yPixelFor` returns a series' y-pixel at the
 * hovered index; a non-finite y skips that series. Returns null when no series qualifies.
 */
export declare function closestHoverSeriesKey(series: readonly ResolvedSeries[], yPixelFor: (series: ResolvedSeries) => number, cursorY: number): string | null;
