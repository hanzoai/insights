import { BarRect } from '../../../core/canvas-renderer';
/** One fully-rounded rect per band, spanning the union of that band's stacked segments — the
 *  pill the bar layer is clipped to for `roundStackEnds`. Bars in the same band share a band-axis
 *  slot (same `dataIndex`), so we group by it and extend along the value axis. */
export declare function stackPillRects(bars: BarRect[], isHorizontal: boolean): BarRect[];
