import { default as React } from 'react';
import { StackedBand } from '../../core/scales';
import { Series, TooltipConfig, TooltipContext } from '../../core/types';
import { BarLayout } from './utils/bars-under-cursor';
export interface BarTooltipProps<Meta> {
    ctx: TooltipContext<Meta>;
    userTooltip?: (ctx: TooltipContext<Meta>) => React.ReactNode;
    /** Every drawn series, including those hidden from the tooltip — the visible-segment
     *  hit-test must see the full stack, not just the tooltip-visible subset. */
    allSeries: Series<Meta>[];
    stackedData: Map<string, StackedBand> | undefined;
    topStackedKeyByAxis: Map<string, string>;
    layout: BarLayout;
    isHorizontal: boolean;
    tooltipConfig?: TooltipConfig;
}
export declare function BarTooltip<Meta>({ ctx, userTooltip, allSeries, stackedData, topStackedKeyByAxis, layout, isHorizontal, tooltipConfig, }: BarTooltipProps<Meta>): React.ReactElement | null;
