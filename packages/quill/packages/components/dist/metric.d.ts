import { ChangeColor, MetricChange, Series, TooltipContext, ChartTheme } from '@hanzo/quill-charts';
import * as React from 'react';
export type { ChangeColor, MetricChange };
interface MetricBaseProps {
    /** Resting headline number. Defaults to `data[data.length - 1]` when `data` is present;
     *  required when `data` is empty or omitted. */
    value?: number;
    /** Labels paired with `data`. Used for the default subtitle on hover. */
    labels?: string[];
    /** Required when `data` is present. */
    theme?: ChartTheme;
    /** Sparkline line + fill color. Falls back to `theme.colors[0]`. */
    color?: string;
    sparklineHeight?: number;
    /** Fill the card's remaining height with the sparkline instead of a fixed `sparklineHeight`. */
    sparklineFill?: boolean;
    sparklineFillOpacity?: number;
    /** Dash the sparkline from this index onward (e.g. an in-progress trailing period). */
    sparklineDashedFromIndex?: number;
    /** Tooltip renderer for the sparkline. Off by default — hovering already scrubs the headline. */
    sparklineTooltip?: (ctx: TooltipContext) => React.ReactNode;
    formatValue?: (value: number) => string;
    formatChange?: (percent: number) => string;
    showChange?: boolean;
    /** Fixed comparison pill. Supplied → no hover-driven fallback. Pass `null` to suppress. */
    change?: MetricChange | null;
    /** Which direction is "good" — drives the pill color. Defaults to `up`. */
    goodDirection?: 'up' | 'down';
    /** Custom pill colors for a change in the good direction; overrides the Badge `success` variant. */
    positiveColor?: ChangeColor;
    /** Custom pill colors for a change in the bad direction; overrides the Badge `destructive` variant. */
    negativeColor?: ChangeColor;
    /** Tooltip shown on hover over the change pill. */
    changeTooltip?: string;
    /** Caption shown at rest and on hover. Always wins over `restingSubtitle` and hovered labels. */
    subtitle?: React.ReactNode;
    /** Caption shown only while at rest (e.g. `'Avg'`); on hover it yields to the hovered point's label. */
    restingSubtitle?: React.ReactNode;
    /** While hovering a sparkline point, swap the resting `change` pill for the hovered point's change
     *  vs the previous point. The resting `change` still shows when not hovering. */
    hoverChangeFromPreviousPoint?: boolean;
    animationMs?: number;
    /** Dwell (ms) a pointer must settle on the sparkline before the headline follows it. `0` disables. */
    hoverIntentMs?: number;
    className?: string;
    dataAttr?: string;
    onError?: (error: Error, info: React.ErrorInfo) => void;
    children: React.ReactNode;
}
export type MetricProps = MetricBaseProps & ({
    /** The metric's values. When present, a `MetricSparkline` renders and hovering a point
     *  swaps the headline. The change pill's fallback also runs on it. */
    data?: number[];
    series?: undefined;
} | {
    /** The metric's values — headline hover, change-pill fallback, and hover indexes. */
    data: number[];
    /** Visual breakdown drawn as one sparkline line per series instead of the single `data`
     *  line. Purely presentational: the headline and pill still read `data`, so give each
     *  series the same point count as `data` to keep hover indexes aligned. The single-line
     *  conveniences (`color`, `sparklineDashedFromIndex`) don't apply — set them per series. */
    series?: Series[];
});
/**
 * Composable metric tile — a headline number, a `Badge` change pill, and an optional `Sparkline`.
 * `Metric` is content, not a surface: wrap it in `<Card flush>` for the border. The root owns the data
 * and hover behavior and hands every derived display value to its parts via context; you choose the
 * layout by composing the parts. It owns its inline padding (`px-4`) so `MetricSparkline` can bleed out.
 *
 * ```tsx
 * <Card flush>
 *   <Metric data={data} labels={labels} theme={theme} color="#fb7185">
 *     <MetricHeader>
 *       <MetricTitle>Active users</MetricTitle>
 *       <MetricDelta />
 *     </MetricHeader>
 *     <MetricValue />
 *     <MetricSubtitle />
 *     <MetricSparkline />
 *   </Metric>
 * </Card>
 * ```
 */
export declare function Metric(props: MetricProps): React.ReactElement | null;
/** Header row: title on the left, change pill (or anything) on the right. */
export declare function MetricHeader({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
export declare function MetricTitle({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
/** Headline number. Follows the hovered sparkline point; pass `children` to render your own, or a
 *  `text-*` class to resize it (cn lets your size win over the default `text-4xl`). */
export declare function MetricValue({ className, children, ...props }: React.ComponentProps<'div'>): React.ReactElement;
/** Change pill — a `Badge` (success/destructive by `goodDirection`, or the root's custom
 *  `positiveColor`/`negativeColor`) with a directional chevron. Renders nothing when there is no
 *  resolved delta. */
export declare function MetricDelta({ className }: {
    className?: string;
}): React.ReactElement | null;
/** Caption under the headline. Renders nothing when empty; pass `children` to override. */
export declare function MetricSubtitle({ className, children, ...props }: React.ComponentProps<'div'>): React.ReactElement | null;
/** Sparkline, bled out to the card edges. Renders nothing when no series was supplied to the root. */
export declare function MetricSparkline({ className, }: {
    className?: string;
}): React.ReactElement | null;
