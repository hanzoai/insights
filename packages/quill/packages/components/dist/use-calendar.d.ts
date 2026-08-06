export declare const Month: {
    readonly JANUARY: 0;
    readonly FEBRUARY: 1;
    readonly MARCH: 2;
    readonly APRIL: 3;
    readonly MAY: 4;
    readonly JUNE: 5;
    readonly JULY: 6;
    readonly AUGUST: 7;
    readonly SEPTEMBER: 8;
    readonly OCTOBER: 9;
    readonly NOVEMBER: 10;
    readonly DECEMBER: 11;
};
export type Month = (typeof Month)[keyof typeof Month];
export declare const Day: {
    readonly SUNDAY: 0;
    readonly MONDAY: 1;
    readonly TUESDAY: 2;
    readonly WEDNESDAY: 3;
    readonly THURSDAY: 4;
    readonly FRIDAY: 5;
    readonly SATURDAY: 6;
};
export type Day = (typeof Day)[keyof typeof Day];
export interface UseCalendarOptions {
    weekStartsOn?: Day;
    viewing?: Date;
    selected?: Date[];
    numberOfMonths?: number;
}
export interface UseCalendarReturn {
    clearTime: (date: Date) => Date;
    inRange: (date: Date, min: Date, max: Date) => boolean;
    viewing: Date;
    setViewing: React.Dispatch<React.SetStateAction<Date>>;
    viewToday: () => void;
    viewMonth: (month: Month) => void;
    viewPreviousMonth: () => void;
    viewNextMonth: () => void;
    viewYear: (year: number) => void;
    viewPreviousYear: () => void;
    viewNextYear: () => void;
    selected: Date[];
    setSelected: React.Dispatch<React.SetStateAction<Date[]>>;
    clearSelected: () => void;
    isSelected: (date: Date) => boolean;
    select: (date: Date | Date[], replaceExisting?: boolean) => void;
    deselect: (date: Date | Date[]) => void;
    toggle: (date: Date, replaceExisting?: boolean) => void;
    selectRange: (start: Date, end: Date, replaceExisting?: boolean) => void;
    deselectRange: (start: Date, end: Date) => void;
    calendar: Date[][][];
}
export declare const useCalendar: ({ weekStartsOn, viewing: initialViewing, selected: initialSelected, numberOfMonths, }?: UseCalendarOptions) => UseCalendarReturn;
