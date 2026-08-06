import { DateTimeRange } from './date-time-ranges';
import { DateFormatOrder } from './segmented-date-input';
import { Day } from './use-calendar';
import * as React from 'react';
export type { DateFormatOrder } from './segmented-date-input';
export interface DateTimeValue {
    start: Date;
    end: Date;
    range: DateTimeRange;
}
export interface DateTimePickerProps {
    value: DateTimeValue;
    onApply: (value: DateTimeValue) => void;
    onCancel?: () => void;
    minDate?: Date;
    maxDate?: Date;
    dateFormat?: DateFormatOrder;
    weekStartsOn?: Day;
    onDateTimeSettings?: () => void;
    compact?: boolean;
    /** Quick-range presets to offer. Defaults to `quickRanges`; `CUSTOM_RANGE` entries are filtered out. */
    ranges?: DateTimeRange[];
    /** Hide the "Choose date range / Quick ranges" header band when embedding in a host surface. */
    showHeader?: boolean;
    /** Day-granular mode: hides the time segments and "Now", and drops time from the footer readout. */
    showTime?: boolean;
    className?: string;
}
export declare function DateTimePicker({ value, onApply, onCancel, minDate, maxDate: maxDateProp, dateFormat, weekStartsOn, onDateTimeSettings, compact, ranges, showHeader, showTime, className, }: DateTimePickerProps): React.ReactElement;
