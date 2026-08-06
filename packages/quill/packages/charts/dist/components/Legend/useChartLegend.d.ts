import { ReactNode } from 'react';
import { ChartLegendConfig, ChartTheme, Series } from '../../core/types';
import { LegendItem } from './Legend';
/** Mark each `hiddenKeys` series as `visibility.excluded` so the chart drops it from rendering,
 *  scales, tooltips, and hit-testing — leaving the visible series to rescale into the freed space.
 *  Other `visibility` flags are preserved. Returns the input untouched when nothing is hidden. */
export declare function applyHiddenSeries<Meta>(series: Series<Meta>[], hiddenKeys: ReadonlySet<string>): Series<Meta>[];
/** Props to spread onto `<ChartLegend>` (everything except `children` and `legendDataAttr`). */
export interface ChartLegendRenderProps {
    show: boolean;
    items: LegendItem[];
    position: NonNullable<ChartLegendConfig['position']>;
    align: ChartLegendConfig['align'];
    gap: ChartLegendConfig['gap'];
    onItemClick?: (key: string) => void;
    hiddenKeys: string[];
    renderItem?: (defaultNode: ReactNode, item: LegendItem) => ReactNode;
}
export interface ChartLegendState<Meta> {
    /** Series with toggled-off entries marked excluded — feed this into the chart's renderer. */
    visibleSeries: Series<Meta>[];
    /** Spread onto `<ChartLegend>`; the legend still lists hidden series (dimmed) so they restore. */
    legendProps: ChartLegendRenderProps;
}
/** Shared plumbing for the multi-series charts' built-in legend. Manages the toggled-off keys
 *  (uncontrolled by default, controlled when `config.hiddenKeys` is set), derives the dimmed
 *  legend items from the *original* series (so hidden ones stay clickable), and returns the
 *  series to actually render with hidden entries excluded. Pass `items` to override the derived
 *  legend rows (e.g. a slope chart's per-series change labels). */
export declare function useChartLegend<Meta>(series: Series<Meta>[], theme: ChartTheme, config: ChartLegendConfig | undefined, items?: LegendItem[]): ChartLegendState<Meta>;
