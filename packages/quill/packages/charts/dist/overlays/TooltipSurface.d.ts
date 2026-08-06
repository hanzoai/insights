import { default as React } from 'react';
export declare const TOOLTIP_FALLBACK_BG = "#1d2330";
export declare const TOOLTIP_FALLBACK_COLOR = "#ffffff";
interface TooltipSurfaceProps {
    children: React.ReactNode;
    className?: string;
    /** Forwarded onto the panel — used for test/automation selectors. */
    'data-attr'?: string;
}
export declare function TooltipSurface({ children, className, 'data-attr': dataAttr, }: TooltipSurfaceProps): React.ReactElement;
/** Round series-color swatch used in tooltip rows. */
export declare function TooltipSwatch({ color }: {
    color: string;
}): React.ReactElement;
export {};
