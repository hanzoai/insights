import { default as React } from 'react';
import { ChartTheme } from '../../core/types';
import { ChangeColor } from './internals';
import { MetricChange } from './resolveDelta';
export type { MetricChange };
export type { ChangeColor };
export interface MetricCardProps {
    title: React.ReactNode;
    /** Resting headline number. Defaults to `data[data.length - 1]` when `data` is present;
     *  required when `data` is empty or omitted. */
    value?: number;
    /** Series values. When present, a sparkline renders below the headline and hovering a point
     *  swaps the headline. */
    data?: number[];
    /** Labels paired with `data`. Used for the default subtitle on hover. */
    labels?: string[];
    /** Required when `data` is present. */
    theme?: ChartTheme;
    /** Sparkline line + fill color. Falls back to `theme.colors[0]`. */
    color?: string;
    sparklineHeight?: number;
    /** Fill the card's remaining height with the sparkline instead of using a fixed `sparklineHeight`. */
    sparklineFill?: boolean;
    sparklineFillOpacity?: number;
    sparklineClassName?: string;
    /** Dash the sparkline from this index onward (e.g. an in-progress trailing period). */
    sparklineDashedFromIndex?: number;
    formatValue?: (value: number) => string;
    formatChange?: (percent: number) => string;
    showChange?: boolean;
    /** Fixed comparison pill. Supplied → no hover-driven fallback. Pass `null` to suppress. */
    change?: MetricChange | null;
    goodDirection?: 'up' | 'down';
    /** Size of the change pill. Defaults to `sm`. */
    changeSize?: 'sm' | 'md';
    /** Render the change pill inline next to the headline instead of in the header row. */
    changeInline?: boolean;
    /** Tooltip shown on hover over the change pill, e.g. explaining what it compares. */
    changeTooltip?: string;
    positiveColor?: ChangeColor;
    negativeColor?: ChangeColor;
    /** Caption under the headline. Defaults to `labels[activeIndex]` when a sparkline is present.
     *  Always wins — shown at rest and on hover. */
    subtitle?: React.ReactNode;
    /** Caption shown only while at rest (e.g. `'Avg'`); on hover it yields to the hovered point's
     *  label. Ignored when `subtitle` is set. */
    restingSubtitle?: React.ReactNode;
    /** While hovering a sparkline point, replace the resting `change` pill with the change from the
     *  previous point (`(data[i] - data[i-1]) / |data[i-1]|`). At the first point there is no previous,
     *  so the pill is hidden. The resting `change` (or fallback) still shows when not hovering. */
    hoverChangeFromPreviousPoint?: boolean;
    animationMs?: number;
    /** Dwell (ms) a pointer must settle on the sparkline before the headline follows it.
     *  Keeps a quick pass-through from grabbing attention. `0` disables the gating. */
    hoverIntentMs?: number;
    className?: string;
    dataAttr?: string;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}
export declare function MetricCard(props: MetricCardProps): React.ReactElement | null;
