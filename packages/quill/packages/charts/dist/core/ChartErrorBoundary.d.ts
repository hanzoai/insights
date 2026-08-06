import { default as React } from 'react';
interface ChartErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}
interface ChartErrorBoundaryState {
    hasError: boolean;
}
export declare class ChartErrorBoundary extends React.Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
    state: ChartErrorBoundaryState;
    static getDerivedStateFromError(): ChartErrorBoundaryState;
    componentDidCatch(error: Error, info: React.ErrorInfo): void;
    render(): React.ReactNode;
}
export {};
