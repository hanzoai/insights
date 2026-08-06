import { Series } from '../../core/types';
import { ValueLabelFormatter } from '../../overlays/ValueLabels';
export interface ValueLabelsConfig {
    seriesKeys?: string[];
    /** Per-segment label text — see `ValueLabelFormatter` for the context and empty-string contract. */
    formatter?: ValueLabelFormatter;
}
export declare function resolveValueLabelsConfig(input: boolean | ValueLabelsConfig | undefined): ValueLabelsConfig | null;
export declare function useSeriesWithValueLabelAllowlist<Meta>(series: Series<Meta>[], seriesKeys: string[] | undefined): Series<Meta>[];
