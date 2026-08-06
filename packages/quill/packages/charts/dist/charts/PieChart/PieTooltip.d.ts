import { default as React } from 'react';
import { TooltipContext } from '../../core/types';
export interface PieTooltipProps<Meta> {
    ctx: TooltipContext<Meta>;
    valueFormatter?: (value: number) => string;
    isPercent?: boolean;
}
export declare function PieTooltip<Meta>({ ctx, valueFormatter, isPercent, }: PieTooltipProps<Meta>): React.ReactElement | null;
