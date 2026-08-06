import { BarShadow } from '../../../core/canvas-renderer';
import { BarsConfig } from '../../../core/types';
export declare const HORIZONTAL_MIN_BAND_SIZE_DEFAULT = 24;
export declare function resolveBarShadow(barShadow: BarsConfig['shadow']): BarShadow | undefined;
export interface WrapperMinHeightOptions {
    isHorizontal: boolean;
    fitToHeight: boolean;
    resolvedMinBandSize: number;
    labels: string[];
}
export declare function computeWrapperMinHeight({ isHorizontal, fitToHeight, resolvedMinBandSize, labels, }: WrapperMinHeightOptions): number | undefined;
