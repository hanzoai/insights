import { default as React } from 'react';
import { TooltipContext } from '../../core/types';
import { BoxPlotAdaptedMeta } from './BoxPlot';
export interface BoxPlotTooltipProps<Meta = unknown> {
    ctx: TooltipContext<BoxPlotAdaptedMeta<Meta>>;
    /** Optional consumer override — passes the original TooltipContext through so the consumer
     *  can render their own template while still reading the original BoxPlotDatum from the
     *  adapter meta on each series. */
    userTooltip?: (ctx: TooltipContext<BoxPlotAdaptedMeta<Meta>>) => React.ReactNode;
    /** Whether multiple series are being shown — drives whether each box's series label is
     *  printed in the header above its stats. */
    grouped: boolean;
}
export declare function BoxPlotTooltip<Meta = unknown>({ ctx, userTooltip, grouped, }: BoxPlotTooltipProps<Meta>): React.ReactElement | null;
