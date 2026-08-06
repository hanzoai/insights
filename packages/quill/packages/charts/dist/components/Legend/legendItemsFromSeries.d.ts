import { ChartTheme, ResolvedSeries, Series } from '../../core/types';
import { LegendItem } from './Legend';
export declare function legendItemsFromSeries(series: ReadonlyArray<Series | ResolvedSeries>, theme: ChartTheme): LegendItem[];
