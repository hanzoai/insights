import { default as React } from 'react';
import { Series } from '../core/types';
interface TrendLineOverlayProps {
    /** Pre-computed trend line series (from buildTrendLineSeries). One per source series. */
    trendSeries: Series[];
}
/** Renders trend lines as SVG polylines over vertical bar and combo charts. */
export declare function TrendLineOverlay({ trendSeries }: TrendLineOverlayProps): React.ReactElement | null;
export {};
