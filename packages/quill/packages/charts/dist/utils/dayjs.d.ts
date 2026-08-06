import { default as dayjs, Dayjs as DayjsOriginal } from 'dayjs';
export { dayjs };
export interface Dayjs extends DayjsOriginal {
}
/** Parse a date string into a Dayjs in the given timezone, browser-tz-independent.
 *
 * - Strings without explicit timezone info ("2026-03-08", "2026-03-08 14:00:00")
 *   are treated as wall-clock time in the given timezone.
 * - Strings with explicit timezone info (trailing "Z" or "±HH:MM") are real instants;
 *   parse them as such and convert into the requested timezone. */
export declare function parseDateInTimezone(dateStr: string, tz: string): Dayjs;
