import { default as React } from 'react';
import { TooltipContext } from '../core/types';
interface TooltipProps<Meta> {
    context: TooltipContext<Meta>;
    renderTooltip: (ctx: TooltipContext<Meta>) => React.ReactNode;
    placement?: 'follow-data' | 'top' | 'cursor';
}
export declare function Tooltip<Meta = unknown>({ context, renderTooltip, placement, }: TooltipProps<Meta>): React.ReactElement;
export {};
