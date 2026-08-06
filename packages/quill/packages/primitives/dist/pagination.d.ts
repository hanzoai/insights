import { ButtonProps } from './button';
import * as React from 'react';
/**
 * Presentational pagination control — composable parts (no internal state). The
 * consumer owns page state and renders an item per page; wire `onClick`/`disabled`
 * on the buttons. Use {@link getPaginationRange} to build a first/last + sibling
 * window with ellipses for large page counts.
 */
declare function Pagination({ className, ...props }: React.ComponentProps<'nav'>): React.ReactElement;
declare namespace Pagination {
    var displayName: string;
}
declare const PaginationContent: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>, "ref"> & React.RefAttributes<HTMLUListElement>>;
declare const PaginationItem: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>, "ref"> & React.RefAttributes<HTMLLIElement>>;
type PaginationButtonProps = ButtonProps & {
    /** Marks the current page — sets `aria-current="page"` and the selected fill. */
    isActive?: boolean;
};
declare const PaginationButton: React.ForwardRefExoticComponent<Omit<PaginationButtonProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const PaginationPrevious: React.ForwardRefExoticComponent<Omit<Omit<PaginationButtonProps, "isActive">, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const PaginationNext: React.ForwardRefExoticComponent<Omit<Omit<PaginationButtonProps, "isActive">, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
type PaginationRangeItem = number | 'ellipsis';
declare function getPaginationRange(pageCount: number, pageIndex: number, siblingCount?: number): PaginationRangeItem[];
export { Pagination, PaginationContent, PaginationItem, PaginationButton, PaginationPrevious, PaginationNext, PaginationEllipsis, getPaginationRange, type PaginationRangeItem, };
