/** Fraction digits needed to keep two significant digits — `minimum` for anything at or above 0.1,
 *  one more for every extra leading zero below that, capped so float residue doesn't render as a wall
 *  of digits. A flat two decimals collapses a small-valued axis into repeated labels: ticks over
 *  0–0.012 all round to "0.01" or "0". `minimum` is nullable because adapters pass a nullable config
 *  field through. */
export declare function significantDecimalPlaces(value: number, minimum?: number | null): number;
export declare function humanFriendlyNumber(d: number, maximumFractionDigits?: number, minimumFractionDigits?: number): string;
export declare function humanFriendlyCurrency(d: string | undefined | number, precision?: number): string;
export declare function humanFriendlyDuration(d: string | number | null | undefined, { maxUnits, secondsPrecision, secondsFixed, }?: {
    maxUnits?: number;
    secondsPrecision?: number;
    secondsFixed?: number;
}): string;
export declare function percentage(division: number, maximumFractionDigits?: number, fixedPrecision?: boolean): string;
export declare function compactNumber(value: number | null): string;
/** Format an amount as currency, prefixed/suffixed by the locale-derived symbol.
 *  Accepts any string the runtime `Intl.NumberFormat` accepts as a currency code. */
export declare function formatCurrency(amount: number, currency: string): string;
export declare function hexToRGBA(hex: string, alpha?: number): string;
