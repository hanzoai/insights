/**
 * Insights Design System — Color Tokens (hue-based theming)
 *
 * Surface/neutral colors are derived from a shared theme hue + tint.
 * Consumers can override `--theme-hue`, `--primary-light`,
 * `--primary-dark` (and optionally `--theme-dark-hue`, `--theme-tint`)
 * on `:root` to shift the palette at runtime — no rebuild required.
 *
 * Status colors (destructive, success, warning, info) are independent
 * of the theme hue.
 */
export interface ThemeConfig {
    /** OKLCH hue angle (0–360) for light mode surfaces */
    hue: number;
    /** OKLCH hue angle for dark mode surfaces */
    darkHue: number;
    /** Base OKLCH chroma for neutral surface tinting (0 = pure grey) */
    tint: number;
    /**
     * Full brand color for light mode — any valid CSS color expression.
     * Consumers typically pass `oklch(L C H)` so L, C, and H are all
     * tunable per mode (not just hue). Override at runtime by setting
     * `--primary-light` on `:root` or any subtree.
     */
    primaryLight: string;
    /** Full brand color for dark mode. See `primaryLight`. */
    primaryDark: string;
}
/** Insights default — warm yellowish-grey surfaces + orange/amber brand */
export declare const DEFAULT_THEME: ThemeConfig;
export type SemanticColorKey = string;
export type ColorTuple = readonly [light: string, dark: string, tailwindClass: string];
/**
 * Build the full semantic color map.
 *
 * Surface/neutral colors use CSS custom property expressions so they
 * respond to runtime `--theme-hue` / `--theme-tint` overrides.
 * Status and brand colors are static OKLCH values.
 */
export declare function buildSemanticColors(): Record<string, ColorTuple>;
export declare const semanticColors: Record<string, ColorTuple>;
export interface StylesConfig {
    /** Include @layer base reset rules (apps only) */
    includeBaseLayer?: boolean;
    /**
     * CSS selector to scope all token CSS vars to. When set, vars are only
     * defined inside elements matching this selector, preventing clashes
     * with the consumer's existing CSS custom properties.
     *
     * Example: `'[data-quill]'` — consumer adds `data-quill` to wrapper
     * elements. During migration the attribute moves up the DOM tree;
     * when it reaches `<html>` the scope is effectively global and can
     * be removed.
     */
    scope?: string;
    /**
     * CSS selector(s) for dark mode. Accepts a single selector or an
     * array — when multiple are given they are combined with `:is()`
     * so any of them activates dark mode.
     *
     * Default: `['.dark', '[theme="dark"]', '[data-theme="dark"]']`. The
     * three flavours cover Tailwind's `.dark` class convention, the bare
     * `theme="dark"` attribute, and the `data-theme="dark"` attribute used
     * by libraries that follow the HTML `data-*` convention (notably
     * `@modelcontextprotocol/ext-apps` SDK's `applyDocumentTheme()`).
     */
    darkSelector?: string | string[];
}
/** Flat object for one theme */
export declare function resolveTheme(mode: 'light' | 'dark'): Record<string, string>;
/** Generate color-system.css (:root light + .dark overrides) */
export declare function generateColorSystemCSS(theme?: ThemeConfig, opts?: Pick<StylesConfig, 'scope' | 'darkSelector'>): string;
export declare function generateStylesCSS(config?: StylesConfig): string;
//# sourceMappingURL=colors.d.ts.map