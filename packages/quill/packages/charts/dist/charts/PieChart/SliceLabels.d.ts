import { default as React } from 'react';
export { nonCollidingKeys } from '../../core/label-collision';
export type { LabelBox } from '../../core/label-collision';
export interface SliceLabelsProps {
    valueFormatter?: (value: number) => string;
    /** Show the slice's value above the slice. Default true. */
    showValueOnSlice?: boolean;
    /** Show the breakdown label above the slice. Default false. When both are true, the
     *  label sits above the value. */
    showLabelOnSlice?: boolean;
    /** Hide labels for slices with `fraction < threshold`. Default 0.05. */
    minSlicePercentForLabel?: number;
    /** Where labels sit along the radius: 0 = center, 1 = outer edge. Default 0.5 (mid-slice). */
    labelRadiusRatio?: number;
    isPercent?: boolean;
}
export declare function SliceLabels({ valueFormatter, showValueOnSlice, showLabelOnSlice, minSlicePercentForLabel, labelRadiusRatio, isPercent, }: SliceLabelsProps): React.ReactElement | null;
