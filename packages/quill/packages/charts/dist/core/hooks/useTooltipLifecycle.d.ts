import { default as React } from 'react';
import { TooltipContext } from '../types';
/** Value-equality check used by the pinned-rebuild effect to skip no-op updates. Compares
 *  dataIndex, label, position, and per-row value/color/series.key/series.label. Series are
 *  compared by stable `key` rather than identity because the parent typically rebuilds the
 *  resolved-series array on every render. */
export declare function isTooltipContextEquivalent<Meta>(a: TooltipContext<Meta>, b: TooltipContext<Meta>): boolean;
export interface UseTooltipLifecycleOptions<Meta> {
    wrapperRef: React.RefObject<HTMLDivElement>;
    /** Rebuilds the pinned tooltip context when `rebuildDeps` change while a pin is held. Receives
     *  the previous pinned context (without `isPinned`/`onUnpin` mutations re-applied — the lifecycle
     *  re-pins after the rebuild). Return `null` to drop the pin (e.g. the data point no longer exists). */
    rebuildPinnedCtx: (prev: TooltipContext<Meta>) => TooltipContext<Meta> | null;
    /** Inputs that should retrigger a pinned rebuild (typically series, labels, scales, dimensions). */
    rebuildDeps: React.DependencyList;
}
export interface UseTooltipLifecycleResult<Meta> {
    hoverIndex: number;
    hoverPosition: {
        x: number;
        y: number;
    } | null;
    tooltipCtx: TooltipContext<Meta> | null;
    /** Sets hover index + position together. Geometry hooks call this when the cursor enters/moves over a data point. */
    setHover: (index: number, position: {
        x: number;
        y: number;
    } | null) => void;
    /** Direct setter for the tooltip context. Geometry hooks use this to publish a freshly-built ctx on mousemove. */
    setTooltipCtx: React.Dispatch<React.SetStateAction<TooltipContext<Meta> | null>>;
    isPinned: boolean;
    /** Clear everything — hover index, hover position, tooltip context (pinned or not). */
    clearTooltip: () => void;
    /** Drop only the pin, leaving hover state intact. Bound to `TooltipContext.onUnpin`. */
    unpin: () => void;
    /** Promote the current tooltipCtx to pinned. No-op when there's no current ctx. */
    pin: () => void;
}
/** Geometry-independent tooltip state and dismiss lifecycle.
 *
 *  Owns: tooltipCtx (and the boolean `isPinned`), hoverIndex/hoverPosition, the three dismiss
 *  effects (scroll outside the chart, pointer-down outside, Escape), and the pinned-rebuild
 *  effect with its value-equivalence bail.
 *
 *  Does NOT own: cursor → index hit-testing (cartesian or radial), or anchor positioning. Geometry
 *  hooks compute those and call `setHover` + `setTooltipCtx` to publish results, and pass a
 *  `rebuildPinnedCtx` callback so the lifecycle can refresh the pin when its inputs change. */
export declare function useTooltipLifecycle<Meta = unknown>({ wrapperRef, rebuildPinnedCtx, rebuildDeps, }: UseTooltipLifecycleOptions<Meta>): UseTooltipLifecycleResult<Meta>;
