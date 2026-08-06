export declare function linearRegression(data: ReadonlyArray<readonly [number, number]>): {
    m: number;
    b: number;
};
/** Symmetric confidence interval bounds for a sample of values, using the normal
 *  approximation (`±z·SE`). Returns `[lower, upper]` arrays, both the same length
 *  as the input. Non-finite values (gaps) are excluded from the spread estimate but
 *  preserved in place in the output. */
export declare function ciRanges(values: number[], ci?: number): [number[], number[]];
export declare function trendLine(values: number[], fitUpTo?: number): number[];
export declare function movingAverage(values: number[], intervals?: number): number[];
