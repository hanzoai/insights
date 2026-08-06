import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import * as React from 'react';
type ScrollEdge = 'top' | 'right' | 'bottom' | 'left';
type ShowScrollToButton = ScrollEdge | 'all' | ReadonlyArray<ScrollEdge>;
export declare const SCROLL_SHADOWS_STYLE_ID = "quill-scroll-area-shadows";
export declare const scrollShadowsCss = "\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"] {\n    --shadow-x-start: 0 0 0 0 transparent;\n    --shadow-x-end: 0 0 0 0 transparent;\n    --shadow-y-start: 0 0 0 0 transparent;\n    --shadow-y-end: 0 0 0 0 transparent;\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-start] {\n    --shadow-x-start: 16px 0 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-end] {\n    --shadow-x-end: -16px 0 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-start] {\n    --shadow-y-start: 0 16px 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-end] {\n    --shadow-y-end: 0 -16px 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::before,\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::after {\n    content: '';\n    position: absolute;\n    inset: 0;\n    pointer-events: none;\n    z-index: 2;\n    border-radius: inherit;\n    transition: box-shadow 200ms ease;\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::before {\n    box-shadow: var(--shadow-x-start) inset, var(--shadow-y-start) inset;\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::after {\n    box-shadow: var(--shadow-x-end) inset, var(--shadow-y-end) inset;\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-start] {\n    --shadow-x-start: 28px 0 24px -16px rgb(0 0 0 / 100%);\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-end] {\n    --shadow-x-end: -28px 0 24px -16px rgb(0 0 0 / 100%);\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-start] {\n    --shadow-y-start: 0 28px 24px -16px rgb(0 0 0 / 100%);\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-end] {\n    --shadow-y-end: 0 -28px 24px -16px rgb(0 0 0 / 100%);\n}\n";
declare function ScrollArea({ className, children, scrollShadows, hideScrollbars, alwaysShowScrollbars, showScrollToButton, viewportClassName, ...props }: ScrollAreaPrimitive.Root.Props & {
    scrollShadows?: boolean;
    hideScrollbars?: boolean;
    alwaysShowScrollbars?: boolean;
    showScrollToButton?: ShowScrollToButton;
    viewportClassName?: string;
}): React.ReactElement;
declare function ScrollBar({ className, orientation, alwaysVisible, ...props }: ScrollAreaPrimitive.Scrollbar.Props & {
    alwaysVisible?: boolean;
}): React.ReactElement;
export { ScrollArea, ScrollBar };
