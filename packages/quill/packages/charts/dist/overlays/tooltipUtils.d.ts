/** Returns the key of the series whose segment contains `cursorY`, or the closest one by distance.
 *
 * When `yPixelBottom` is present alongside `yPixel` (stacked bar segments), uses range
 * containment: the series whose [top, bottom] range contains the cursor wins outright. This is
 * exact regardless of segment size differences — no midpoint dead-zones at boundaries.
 *
 * When only `yPixel` is present (line dots, non-stacked bars), falls back to closest by distance.
 */
export declare function findClosestSeriesKey(rows: Array<{
    series: {
        key: string;
    };
    yPixel?: number;
    yPixelBottom?: number;
}>, cursorY: number): string | null;
