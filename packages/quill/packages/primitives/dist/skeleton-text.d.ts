import * as React from 'react';
type SkeletonTextProps = {
    lines?: number;
    className?: string;
    minWidth?: number;
    maxWidth?: number;
};
declare function SkeletonText({ lines, className, minWidth, maxWidth }: SkeletonTextProps): React.ReactElement;
export { SkeletonText };
