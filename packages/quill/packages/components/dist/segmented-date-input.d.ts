import * as React from 'react';
export type DateFormatOrder = 'MDY' | 'DMY' | 'YMD';
export declare const DATE_FORMAT_LABELS: Record<DateFormatOrder, string>;
export interface SegmentedDateInputProps {
    date: Date;
    maxDate: Date;
    onChange: (date: Date) => void;
    dateFormat: DateFormatOrder;
    /** Show hour/minute segments alongside the date. */
    showTime: boolean;
}
/**
 * Segmented numeric date (+ optional time) entry shared by DatePicker and DateTimePicker.
 * Edits are debounced before committing so partially-typed values don't fire onChange.
 * Time-format follow-ups (12/24h, granularity) belong here so both pickers inherit them.
 */
export declare function SegmentedDateInput({ date, maxDate, onChange, dateFormat, showTime, }: SegmentedDateInputProps): React.ReactElement;
