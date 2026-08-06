/**
 * Insights Design System — Shadow Tokens
 */
export declare const shadow: {
    readonly sm: "0 2px 0 color-mix(in oklab, var(--border), transparent 10%)";
    readonly md: "0 3px 0 color-mix(in oklab, var(--border), transparent 10%)";
    readonly lg: "0 6px 0 color-mix(in oklab, var(--border), transparent 10%)";
    readonly line: "0 -1px 0px 0px color-mix(in oklab, var(--border), transparent 10%)";
};
export type Shadow = typeof shadow;
/** Generate Tailwind v4 @theme shadow vars (--shadow-*) */
export declare function generateShadowCSS(): string;
//# sourceMappingURL=shadow.d.ts.map