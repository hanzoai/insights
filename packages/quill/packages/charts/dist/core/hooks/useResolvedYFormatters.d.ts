import { ChartScales } from '../types';
type YTickFormatter = (value: number) => string;
/** Resolves the left/primary y-axis tick formatter: the caller's formatter when set, else one
 *  auto-derived from the primary axis ticks. Stacked secondary axes format themselves in
 *  AxisLabels (each against its own ticks), so this only covers the primary axis. */
export declare function useResolvedYFormatter(scales: ChartScales | null, yTickFormatter: YTickFormatter | undefined): YTickFormatter;
export {};
