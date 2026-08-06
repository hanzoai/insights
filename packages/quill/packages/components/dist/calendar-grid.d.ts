import { Day } from './use-calendar';
import * as React from 'react';
export declare const INSIGHTS_START_DATE: Date;
export declare const WEEK_DAYS: string[];
export declare const MONTH_NAMES: string[];
interface DayItemProps {
    day: Date;
    startDate: Date;
    endDate: Date;
    viewing: Date;
    minDate?: Date;
    maxDate: Date;
    onClick: (day: Date) => void;
}
export declare function DayItem({ day, startDate, endDate, viewing, minDate, maxDate, onClick, }: DayItemProps): React.ReactElement;
interface CalendarProps {
    defaultViewing: Date;
    startDate: Date;
    endDate: Date;
    minDate?: Date;
    maxDate: Date;
    onSelect: (day: Date) => void;
    onViewChange: (month: Date) => void;
    siblingViewing?: Date;
    weekStartsOn?: Day;
}
export declare function Calendar({ defaultViewing, startDate, endDate, minDate, maxDate, onSelect, onViewChange, siblingViewing, weekStartsOn, }: CalendarProps): React.ReactElement;
export {};
