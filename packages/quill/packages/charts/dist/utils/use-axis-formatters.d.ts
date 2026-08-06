import { TooltipConfig, YAxis } from '../core/types';
import { TimeInterval } from './dates';
import { YFormatterConfig } from './y-formatters';
export interface XAxisConfig {
    label?: string;
    /** Explicit tick formatter. When set, it wins over the auto date formatter. */
    tickFormatter?: (value: string, index: number) => string | null;
    hide?: boolean;
    /** Timezone used when interpreting date labels for the auto date formatter. */
    timezone?: string;
    /** Bucket size for the auto date formatter. */
    interval?: TimeInterval;
    /** Source dates for the auto date formatter. Falls back to `labels` when omitted. */
    allDays?: string[];
}
export interface YAxisConfig extends YFormatterConfig {
    /** Axis id — matches `Series.yAxisId`. Only meaningful in the array (multi-axis) form; the
     *  first entry defaults to the primary axis id (`'left'`). */
    id?: string;
    /** Which side this axis renders on. Only meaningful in the array (multi-axis) form; the first
     *  entry defaults to `'left'`, subsequent entries to `'right'`. */
    position?: 'left' | 'right';
    label?: string;
    scale?: 'linear' | 'log';
    /** Custom tick formatter. When set, it wins over `format`. */
    tickFormatter?: (value: number) => string;
    hide?: boolean;
    showGrid?: boolean;
    /** Y-axis baseline behavior. The default (`undefined`/`true`) clamps a non-negative axis down to
     *  0. Set `false` to float the axis to its data range instead (zoom in on the variation). Ignored
     *  on a log scale; honored per axis in the array (multi-axis) form, except axes carrying bar
     *  series, which always draw from 0. */
    startAtZero?: boolean;
}
export declare function useXTickFormatter(xAxis: XAxisConfig | undefined, labels: string[]): ((value: string, index: number) => string | null) | undefined;
/** Tooltip config with the header label defaulted to a full formatted date when the x-axis is
 *  date-driven (`timezone` + `interval` set) — the axis ticks are already auto-formatted then, so
 *  a raw ISO header would be the odd one out. An explicit `labelFormatter` wins. */
export declare function useTimeSeriesTooltipConfig(tooltip: TooltipConfig | undefined, xAxis: XAxisConfig | undefined): TooltipConfig | undefined;
/** Non-hook resolution of a {@link YAxisConfig} into a tick formatter. An explicit `tickFormatter`
 *  wins; otherwise a formatter is built from the format fields, or `undefined` when none are set
 *  (so callers auto-format against the axis's own ticks). Shared by {@link useYTickFormatter} and
 *  the per-axis resolution in multi-axis charts (where a hook can't run per array entry). */
export declare function resolveYTickFormatter(yAxis: YAxisConfig | undefined): ((value: number) => string) | undefined;
interface NormalizedYAxis {
    id: string;
    position: 'left' | 'right';
    config: YAxisConfig;
}
/** Normalize the user `yAxis` config into a per-axis list. A single object (or omitted) is the
 *  primary left axis; an array assigns ids/positions, defaulting the first entry to the primary
 *  left axis and subsequent entries to the right. */
export declare function normalizeYAxisList(yAxis: YAxisConfig | YAxisConfig[] | undefined): NormalizedYAxis[];
/** Resolve a normalized axis list into the {@link YAxis}es the base chart consumes —
 *  each axis's id, side, scale, label, and resolved tick formatter. */
export declare function buildYAxes(axisList: NormalizedYAxis[]): YAxis[];
/** Resolve the primary (left) axis from a normalized list — the entry whose id is the default
 *  axis id, falling back to the first entry. Drives the base chart's scalar y-config. */
export declare function primaryYAxisConfig(axisList: NormalizedYAxis[]): YAxisConfig | undefined;
export declare function useYTickFormatter(yAxis: YAxisConfig | undefined): ((value: number) => string) | undefined;
export {};
