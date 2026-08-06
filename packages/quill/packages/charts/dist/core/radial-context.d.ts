import { PieLayout } from './radial-layout';
/** Layout-stable values exposed to radial overlays (slice labels, custom decorations). Identity
 *  does NOT change on hover. */
export interface RadialLayoutContextValue<Meta = unknown> {
    layout: PieLayout<Meta>;
    /** Returns the current canvas bounding rect, or null if the canvas is unmounted. */
    canvasBounds: () => DOMRect | null;
}
export declare const RadialLayoutContext: import('react').Context<RadialLayoutContextValue<unknown> | null>;
/** Subscribes to radial layout state. Throws if used outside a `<RadialChart>` / `<PieChart>`. */
export declare function useRadialLayout<Meta = unknown>(): RadialLayoutContextValue<Meta>;
