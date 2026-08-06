import { ScaleBand } from 'd3-scale';
import { D3YScale, StackedBand } from './scales';
import { ChartDimensions, Series, SeriesType, ValueDomain } from './types';
/** Combo chart scale set — a band x-axis plus per-axis value scales spanning every series on
 *  that axis. `yAxes` is always populated (even for single-axis charts) so combo draw code has
 *  one lookup path. `group` is the sub-band for grouped bar layout, built from bar-series keys
 *  only — lines/areas don't participate.
 *
 *  `value` aliases the primary axis scale so the set is structurally a `BarScaleSet` and can be
 *  passed straight into the shared bar helpers (`computeBarAtIndex`, `bandCenter`, `resolveBarsAtCursor`);
 *  `y`/`yAxes` let `resolveYScaleForSeries` resolve a series' own axis scale. */
export interface ComboScaleSet {
    band: ScaleBand<string>;
    yAxes: Record<string, {
        scale: D3YScale;
        position: 'left' | 'right';
    }>;
    /** Primary (default/left) axis value scale. */
    y: D3YScale;
    /** Alias of `y` — present so this set satisfies `BarScaleSet` for the shared bar helpers. */
    value: D3YScale;
    group?: ScaleBand<string>;
}
/** Brand for the ComboChart `ChartScales._private` slot. Single source of truth so a shape
 *  change in `ComboScaleSet` doesn't drift between consumers. */
export interface ComboChartPrivate {
    __comboChart: ComboScaleSet;
}
export interface CreateComboScalesOptions {
    scaleType?: 'linear' | 'log';
    barLayout?: 'stacked' | 'grouped' | 'percent';
    bandPadding?: number;
    groupPadding?: number;
    seriesTypeOf: (series: Series) => SeriesType;
    /** Stacked-band data for bar series. Required when `barLayout` is `'stacked'`. */
    barStackedData?: Map<string, StackedBand>;
    /** Applied to the primary (default/left) axis only — goal lines (`{ include }`) render against
     *  the primary axis, so secondary axes keep their own data-derived scale. See {@link ValueDomain}. */
    valueDomain?: ValueDomain;
    /** Per-axis overrides — explicit values win over the alternating-side default and
     *  `options.scaleType`. `startAtZero: false` is ignored for axes carrying bar series. */
    axes?: {
        id: string;
        position?: 'left' | 'right';
        scaleType?: 'linear' | 'log';
        startAtZero?: boolean;
    }[];
}
export declare function resolveSeriesType(series: Pick<Series, 'type'>, defaultType: SeriesType): SeriesType;
export declare function isLineLike(type: SeriesType): boolean;
export declare function createComboScales(series: Series[], labels: string[], dimensions: ChartDimensions, options: CreateComboScalesOptions): ComboScaleSet;
/** Partition visible series into bar vs line/area buckets, preserving input order within each
 *  bucket. Excluded series are dropped. */
export declare function partitionByType<S extends Pick<Series, 'visibility'>>(series: readonly S[], typeOf: (s: S) => SeriesType): {
    bars: S[];
    lines: S[];
};
