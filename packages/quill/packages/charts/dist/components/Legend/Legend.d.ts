import { default as React } from 'react';
export interface LegendItem {
    key: string;
    label: string;
    color: string;
    /** Optional trailing text shown muted after the label — e.g. a slope chart's per-series change. */
    secondaryLabel?: string;
}
export interface LegendProps {
    items: LegendItem[];
    orientation?: 'horizontal' | 'vertical';
    align?: 'start' | 'center' | 'end';
    onItemClick?: (key: string) => void;
    hiddenKeys?: string[];
    className?: string;
    dataAttr?: string;
    /** Wrap each row — receives the default row node and its item, returns the node to render.
     *  Use to augment rows (e.g. a right-click context menu) while keeping the default rendering. */
    renderItem?: (defaultNode: React.ReactNode, item: LegendItem) => React.ReactNode;
}
export declare function Legend({ items, orientation, align, onItemClick, hiddenKeys, className, dataAttr, renderItem, }: LegendProps): React.ReactElement | null;
