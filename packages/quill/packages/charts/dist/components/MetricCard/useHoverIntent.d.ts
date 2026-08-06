/**
 * Debounces a sparkline hover index so a cursor merely passing over the card on its way
 * elsewhere doesn't swap the headline — the pointer has to settle on a point for `delayMs`
 * before it takes effect. Leaving the sparkline (a negative index) applies immediately, so
 * the headline drops straight back to rest. `delayMs <= 0` opts out.
 *
 * Mirrors the app's `useDebouncedValue`, which this standalone package can't import.
 */
export declare function useHoverIntent(rawIndex: number, delayMs: number): number;
