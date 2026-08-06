import { DateFormatOrder } from './segmented-date-input';
import { Day } from './use-calendar';
import * as React from 'react';
export interface DatePickerProps {
    value: Date;
    onApply: (value: Date) => void;
    onCancel?: () => void;
    minDate?: Date;
    maxDate?: Date;
    dateFormat?: DateFormatOrder;
    weekStartsOn?: Day;
    onDateTimeSettings?: () => void;
    /** Include time in the value initially. When off, the value is floored to the start of the day. */
    showTime?: boolean;
    /** Render the "Include time" toggle so the user can switch time on and off. Defaults to `showTime`. Set false for a fixed precision. */
    showTimeToggle?: boolean;
    /** Fired when the "Include time" toggle changes. */
    onIncludeTimeChange?: (includeTime: boolean) => void;
    className?: string;
}
export declare function DatePicker({ value, onApply, onCancel, minDate, maxDate: maxDateProp, dateFormat, weekStartsOn, onDateTimeSettings, showTime, showTimeToggle, onIncludeTimeChange, className, }: DatePickerProps): React.ReactElement;
