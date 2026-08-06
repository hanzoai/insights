import { ColumnDef, RowData } from '@tanstack/react-table';
import * as React from 'react';
declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        align?: 'left' | 'center' | 'right';
        expand?: boolean;
    }
}
export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    /** Sizing/scroll classes for the table container (forwarded to the Table primitive). */
    className?: string;
    /** Sticky header mode, forwarded to the Table primitive. `'page'` sticks to document scroll. */
    stickyHeader?: boolean | 'page';
    /**
     * Stretch the table to fill its container (forwarded to the Table primitive).
     * Mark a column with `meta: { expand: true }` to choose which one absorbs the
     * slack.
     */
    fullWidth?: boolean;
    /**
     * Cell density, forwarded to the Table primitive. `'sm'` tightens head/cell
     * inline padding to `0.75rem` — pair with a `Card size="sm"` so edge columns
     * align with the card's inline padding.
     */
    size?: 'default' | 'sm';
    /**
     * Rendered in place of rows when `data` is empty. Defaults to a minimal
     * "No results" Empty; pass a richer node (custom copy, actions) to override.
     */
    empty?: React.ReactNode;
    /**
     * Enables client-side pagination at this page size and renders a pager below
     * the table. Omit for a single, un-paginated list.
     */
    pageSize?: number;
    /**
     * Page-size choices shown in a selector beside the pager. Only rendered when
     * `pageSize` is set; omit to hide the selector and keep a fixed page size.
     */
    pageSizeOptions?: number[];
}
/**
 * Headless TanStack Table wired onto the quill Table primitive — client-side
 * sorting out of the box (sortable columns render a sort button + indicator and
 * set `aria-sort`), selection reflected via the row's `data-state`, optional
 * pagination, and an empty state. Pass `enableSorting: false` on a column to opt
 * it out, `meta: { align }` to align a column's header and cells, or
 * `fullWidth` + `meta: { expand: true }` to stretch one column to fill.
 */
declare function DataTable<TData, TValue>({ columns, data, className, stickyHeader, fullWidth, size, empty, pageSize, pageSizeOptions, }: DataTableProps<TData, TValue>): React.ReactElement;
export { DataTable };
