import { BarScaleSet } from '../../core/scales';
import { BandSlot, BoxRect } from '../../core/types';
import { BoxPlotDatum } from './types';
/** Resolve only the band-axis extent of a (series, x) slot. Cheap — touches the band/group
 *  scales and nothing on the value axis — so callers like band-only hit-testing don't pay
 *  for six value-axis lookups they'd immediately throw away. */
export declare function computeBoxBand(seriesKey: string, label: string, scales: BarScaleSet, grouped: boolean): BandSlot | null;
export interface ComputeBoxRectOptions {
    seriesKey: string;
    label: string;
    dataIndex: number;
    datum: BoxPlotDatum;
    scales: BarScaleSet;
    /** Whether the chart is in grouped mode (multiple series → side-by-side boxes within a band). */
    grouped: boolean;
}
/** Single-box geometry. Pure: takes already-built scales and returns pixel coordinates only.
 *  Returns `null` when any of (band, group offset, value pixel) can't be resolved — usually
 *  the series isn't in the group scale, or one of the six numbers is non-finite. */
export declare function computeBoxRect({ seriesKey, label, dataIndex, datum, scales, grouped, }: ComputeBoxRectOptions): BoxRect | null;
export interface ComputeSeriesBoxesOptions {
    seriesKey: string;
    data: (BoxPlotDatum | null)[];
    labels: string[];
    scales: BarScaleSet;
    grouped: boolean;
}
/** Lays out every renderable box for one series. Skipped indices (`null` datum or
 *  unresolvable scales) are dropped from the result — the caller can join back to the
 *  original `data` via `BoxRect.dataIndex`. */
export declare function computeSeriesBoxes({ seriesKey, data, labels, scales, grouped }: ComputeSeriesBoxesOptions): BoxRect[];
