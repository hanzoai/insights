import { LegendItem } from '../../components/Legend/Legend';
import { ChartTheme, ResolvedSeries, Series } from '../../core/types';
/** Legend items for a slope chart — `legendItemsFromSeries` plus a per-series change
 *  (`end − start`, formatted) carried as each row's `secondaryLabel`. Rows are ordered
 *  biggest-to-smallest by end value so the legend matches the lines' vertical order at
 *  the right edge (and the tooltip's ordering). Sorting the built items rather than the
 *  input series keeps each swatch's colour — `legendItemsFromSeries` assigns palette
 *  colours by input index — matched to its line. */
export declare function slopeLegendItems(series: ReadonlyArray<Series | ResolvedSeries>, theme: ChartTheme, deltaFormatter: (delta: number) => string): LegendItem[];
