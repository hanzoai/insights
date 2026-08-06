import * as React from 'react';
type Sticky = 'left' | 'right';
type Align = 'left' | 'center' | 'right';
type VAlign = 'top' | 'middle' | 'bottom';
type CellLayout = {
    align?: Align;
    valign?: VAlign;
    /** Absorb remaining width in a `fullWidth` table. Mark one column per table. */
    expand?: boolean;
};
type TableProps = React.ComponentProps<'table'> & {
    /**
     * `true` — header sticks within the table's own scroll viewport (needs a
     * bounded height). `'page'` — header sticks to document scroll instead; the
     * wrappers drop their scroll container so stickiness escapes to the page.
     * Offset it past fixed page chrome with `--quill-table-sticky-top`.
     */
    stickyHeader?: boolean | 'page';
    /**
     * Stretch the table to fill its container instead of sizing to content (so it
     * never scrolls horizontally). Pair with `expand` on a column to choose which
     * one soaks up the slack; otherwise the extra width spreads across columns.
     */
    fullWidth?: boolean;
    /**
     * Cell density. `'sm'` tightens the head/cell inline padding to `0.75rem`
     * (from `1rem`) so the table's edge columns line up with a `Card size="sm"`'s
     * `0.75rem` inline padding. Pair with `Card size="sm" flush`.
     */
    size?: 'default' | 'sm';
    /** Classes for the inner `<table>`. Size/scroll go on the container via `className`. */
    tableClassName?: string;
    /** Ref to the scrolling viewport — for scroll-to-row, virtualization, IntersectionObservers, etc. */
    viewportRef?: React.Ref<HTMLDivElement>;
};
declare const Table: React.ForwardRefExoticComponent<Omit<TableProps, "ref"> & React.RefAttributes<HTMLTableElement>>;
declare const TableHeader: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>, "ref"> & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableBody: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>, "ref"> & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableFooter: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>, "ref"> & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableRow: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>, "ref"> & React.RefAttributes<HTMLTableRowElement>>;
declare const TableHead: React.ForwardRefExoticComponent<Omit<React.ClassAttributes<HTMLTableHeaderCellElement> & React.ThHTMLAttributes<HTMLTableHeaderCellElement> & {
    sticky?: Sticky;
} & CellLayout, "ref"> & React.RefAttributes<HTMLTableCellElement>>;
declare const TableCell: React.ForwardRefExoticComponent<Omit<React.ClassAttributes<HTMLTableDataCellElement> & React.TdHTMLAttributes<HTMLTableDataCellElement> & {
    sticky?: Sticky;
} & CellLayout, "ref"> & React.RefAttributes<HTMLTableCellElement>>;
declare const TableEmpty: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement>, "ref"> & React.RefAttributes<HTMLTableCellElement>>;
declare const TableCaption: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>, "ref"> & React.RefAttributes<HTMLTableCaptionElement>>;
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableEmpty, TableCaption };
