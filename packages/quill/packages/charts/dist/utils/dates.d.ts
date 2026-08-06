import { parseDateInTimezone } from './dayjs';
/** Bucket size for a date-based X axis. Mirrors `IntervalType` from product code without
 * coupling script-charts to it. */
export type TimeInterval = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
interface CreateXAxisTickCallbackArgs {
    interval?: TimeInterval;
    allDays: (string | number)[];
    timezone: string;
}
export declare function createXAxisTickCallback({ interval, allDays, timezone, }: CreateXAxisTickCallbackArgs): ((value: string | number, index: number) => string | null) | undefined;
export declare const parseDateForAxis: typeof parseDateInTimezone;
/** Full date label for a tooltip header. Unlike the sparse, abbreviated axis ticks, every point
 *  gets a complete, unambiguous label, with the weekday when the bucket names a single day
 *  ("Sat, Jun 6, 2026", "Sat, Jun 6, 14:00" — but week/month buckets span days, so no weekday).
 *  Non-date labels pass through unchanged. */
export declare function createTooltipDateFormatter({ interval, timezone, }: {
    interval: TimeInterval;
    timezone: string;
}): (label: string) => string;
export {};
