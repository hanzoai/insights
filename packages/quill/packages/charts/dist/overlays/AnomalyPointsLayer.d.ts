import { default as React } from 'react';
export interface AnomalyMarker {
    /** Index along the x-axis (into the chart's `labels` array). */
    dataIndex: number;
    /** y-value at the marker (used to position via the y-scale). */
    value: number;
    /** Color to fill the marker (typically the source series's color). */
    color: string;
    /** y-axis id the marker is positioned against. */
    yAxisId: string;
}
interface AnomalyPointsLayerProps {
    markers: AnomalyMarker[];
    /** Radius of each marker in CSS pixels. Defaults to 3, matching the legacy chart.js style. */
    radius?: number;
}
/** Renders alert anomaly points as small filled circles positioned by the chart's scales.
 *
 *  Sits on top of the canvas so the dots stay crisp when the chart re-renders. We render
 *  via DOM rather than canvas so the points don't compete with the line/area drawing
 *  pipeline (a sibling Series<>` would force `drawLine` to stitch a connecting line through
 *  NaN values — `tracePath` doesn't reset on gaps, see `core/canvas-renderer.ts`). */
export declare function AnomalyPointsLayer({ markers, radius }: AnomalyPointsLayerProps): React.ReactElement | null;
export {};
