/**
 * Insights Design System — Typography Tokens
 */
export declare const fontSize: {
    readonly xxs: readonly [string, {
        readonly lineHeight: string;
    }];
    readonly xs: readonly [string, {
        readonly lineHeight: string;
    }];
    readonly sm: readonly [string, {
        readonly lineHeight: string;
    }];
    readonly base: readonly [string, {
        readonly lineHeight: string;
    }];
    readonly lg: readonly [string, {
        readonly lineHeight: string;
    }];
    readonly xl: readonly [string, {
        readonly lineHeight: string;
    }];
    readonly '2xl': readonly [string, {
        readonly lineHeight: string;
    }];
};
export declare const fontFamily: {
    readonly sans: readonly ["Zen", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"];
    readonly mono: readonly ["JetBrains Mono", "Fira Code", "monospace"];
};
export type FontSize = typeof fontSize;
export type FontFamily = typeof fontFamily;
/** Generate Tailwind v4 @theme font-size vars (--text-* + --text-*--line-height) */
export declare function generateFontSizeCSS(): string;
/** Generate Tailwind v4 @theme font-family vars (--font-*) */
export declare function generateFontFamilyCSS(): string;
//# sourceMappingURL=typography.d.ts.map