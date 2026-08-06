import { default as React } from 'react';
import { LegendItem } from './Legend';
export interface ChartLegendProps {
    /** When false, renders children with no wrapper and no legend. Defaults to true. */
    show?: boolean;
    items: LegendItem[];
    position?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
    gap?: number;
    onItemClick?: (key: string) => void;
    hiddenKeys?: string[];
    className?: string;
    /** Wrap each legend row — forwarded to {@link Legend}'s `renderItem`. */
    renderItem?: (defaultNode: React.ReactNode, item: LegendItem) => React.ReactNode;
    /** data-attr on the inner `<Legend>`. The outer layout wrapper has no data-attr. */
    legendDataAttr?: string;
    children: React.ReactNode;
}
export declare function ChartLegend({ show, items, position, align, gap, onItemClick, hiddenKeys, className, renderItem, legendDataAttr, children, }: ChartLegendProps): React.ReactElement;
