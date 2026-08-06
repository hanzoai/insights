import { default as React } from 'react';
export interface ChartLegendLayoutProps {
    legend: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
    gap?: number;
    className?: string;
    dataAttr?: string;
    children: React.ReactNode;
}
export declare function ChartLegendLayout({ legend, position, align, gap, className, dataAttr, children, }: ChartLegendLayoutProps): React.ReactElement;
