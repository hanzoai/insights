import { ReactNode } from 'react';
export interface MetricChange {
    value: number;
    label?: ReactNode;
}
export interface ResolvedDelta {
    value: number;
    label: ReactNode;
}
export declare function resolveDelta({ showChange, change, fallbackChangePercent, formatChange, }: {
    showChange: boolean;
    change: MetricChange | null | undefined;
    fallbackChangePercent: number | null;
    formatChange: (p: number) => string;
}): ResolvedDelta | null;
