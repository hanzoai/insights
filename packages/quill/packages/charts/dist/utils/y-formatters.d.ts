export type YAxisFormat = 'numeric' | 'percentage' | 'percentage_scaled' | 'currency' | 'duration' | 'duration_ms' | 'duration_ns' | 'short';
export interface YFormatterConfig {
    /** `percentage` expects values in `0–100`; `percentage_scaled` expects values in `0–1`. */
    format?: YAxisFormat;
    prefix?: string;
    suffix?: string;
    decimalPlaces?: number;
    minDecimalPlaces?: number;
    /** Currency code (e.g. `'USD'`). Used when `format === 'currency'`. */
    currency?: string;
}
export declare function buildYTickFormatter(config: YFormatterConfig): (value: number) => string;
