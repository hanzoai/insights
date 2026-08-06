export type DateTimeRangeName = string;
export interface DateTimeRange {
    id: number;
    name: DateTimeRangeName;
    /** Returns the range's start for a given "now". */
    rangeSetter: (date: Date) => Date;
    /** Returns the range's end for a given "now". Defaults to "now" itself. */
    endSetter?: (date: Date) => Date;
}
export declare const CUSTOM_RANGE: DateTimeRange;
export declare const quickRanges: DateTimeRange[];
