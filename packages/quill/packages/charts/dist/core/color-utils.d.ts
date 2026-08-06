import { ResolvedSeries, Series } from './types';
/** Translucent variant of a series colour (any CSS color form d3 can parse — hex 3/6 digit,
 *  rgb/rgba, named, HSL). Falls back to the raw string when `d3.color` returns `null`. */
export declare function dimColor(color: string, alpha: number): string;
/** Resolve a CSS custom-property reference (`var(--x)`, with an optional fallback) to its
 *  computed color value. A canvas 2D context can't resolve `var()`, so an accent handed to
 *  `fillStyle`/`strokeStyle` (or through `dimColor`, which relies on `d3.color` parsing it)
 *  must be a concrete color first. Non-`var()` inputs, and SSR/no-DOM contexts, return the
 *  input unchanged; `root` defaults to `document.body` to match {@link themeFromCssVars}. */
export declare function resolveCssColor(color: string, root?: HTMLElement): string;
/** Linear RGB interpolation between two colors. `t` is clamped to [0, 1]; `t=0` returns `from`,
 *  `t=1` returns `to`. Falls back to `from` when either color can't be parsed. */
export declare function mixColors(from: string, to: string, t: number): string;
/** Fill color for the bar at `index`: the per-bar override (`bars[index].color`) when set, else the
 *  series color. The one resolver every bar color-read site (fill, hover highlight, tooltip swatch,
 *  value labels) should use, so a per-bar series can't accidentally render bars in the series color. */
export declare function barColorAt(series: ResolvedSeries, index: number): string;
export declare function barColorAt(series: Pick<Series, 'color' | 'bars'>, index: number): string | undefined;
