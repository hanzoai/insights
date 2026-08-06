import { ChartTheme } from './types';
/**
 * Fallback categorical palette, used only when the `--data-color-*` CSS vars
 * aren't loaded (no `@hanzo/quill-tokens` stylesheet, or SSR with no DOM).
 *
 * Charts are headless — colors normally come from the host's design tokens via
 * {@link themeFromCssVars}. `@hanzo/quill-tokens` is the source of truth for
 * these values (`dataColorPalette`); this literal copy keeps the package's
 * runtime dependency-free so a missing stylesheet degrades to a visible palette
 * instead of black. `theme.test.ts` asserts it stays equal to the token palette,
 * so the duplication can't silently drift — update both together.
 */
export declare const DEFAULT_CHART_COLORS: readonly string[];
export interface ThemeFromCssOptions {
    /**
     * Element whose computed styles are read. Token vars defined on `:root`
     * inherit down to any element, and dark-mode overrides applied to `<body>`
     * (the visual test-runner flips `body[theme="dark"]`) are only visible at
     * or below `<body>` — so the default is `document.body`, not `<html>`.
     */
    root?: HTMLElement;
    /** How many `--data-color-N` vars to read (default 15, the token count). */
    colorCount?: number;
}
/**
 * Build a {@link ChartTheme} from the quill data-viz CSS vars
 * (`--data-color-*`, `--color-graph-*`, surface/text tokens). Reads computed
 * styles once; pair with {@link useChartTheme} to re-read on theme changes.
 *
 * Safe on the server / before mount: returns the fallback palette when there's
 * no DOM.
 */
export declare function themeFromCssVars(options?: ThemeFromCssOptions): ChartTheme;
/**
 * React hook returning a {@link ChartTheme} read from the quill data-viz CSS
 * vars, kept in sync as the active theme changes. Watches the `class` / `theme`
 * attributes on both `<html>` and `<body>` (different toggling conventions set
 * one or the other) and re-reads the vars whenever they flip.
 */
export declare function useChartTheme(options?: ThemeFromCssOptions): ChartTheme;
