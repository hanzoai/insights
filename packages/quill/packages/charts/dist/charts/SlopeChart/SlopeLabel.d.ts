import { default as React } from 'react';
import { SlopeSide } from './slope-data';
export declare const SLOPE_LABEL_FONT_SIZE = 12;
/** The font slope labels render and measure with — keeps rendering and width measurement in step. */
export declare const SLOPE_LABEL_FONT = "600 12px -apple-system, BlinkMacSystemFont, \"Inter\", \"Segoe UI\", \"Roboto\", Helvetica, Arial, sans-serif";
export interface SlopeLabelProps {
    x: number;
    y: number;
    /** CSS transform anchoring the label relative to its `(x, y)` point. */
    transform: string;
    color: string;
    text: string;
    dataAttr: string;
    side?: SlopeSide;
}
/** A single non-interactive slope label: series-colored text positioned absolutely at `(x, y)` and
 *  offset by `transform`. Shared by the value-label columns and the end-anchored series names. */
export declare function SlopeLabel({ x, y, transform, color, text, dataAttr, side }: SlopeLabelProps): React.ReactElement;
