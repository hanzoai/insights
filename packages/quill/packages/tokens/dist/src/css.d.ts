/**
 * Shared CSS generation helpers for token files.
 */
/** Generate CSS custom property lines from a flat key-value map */
export declare function cssVars(tokens: Record<string, string>, prefix: string, indent?: string): string;
/** Generate CSS custom property lines without a prefix */
export declare function cssVarsFlat(tokens: Record<string, string>, indent?: string): string;
/** Quote a font name if it contains spaces, otherwise return as-is */
export declare function quoteFontName(name: string): string;
/** Format a font family array as a CSS value */
export declare function fontFamilyValue(fonts: readonly string[]): string;
//# sourceMappingURL=css.d.ts.map