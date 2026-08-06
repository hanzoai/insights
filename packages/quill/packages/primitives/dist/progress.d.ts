import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const progressIndicatorVariants: (props?: ({
    variant?: "default" | "destructive" | "info" | "warning" | "success" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
type ProgressVariantProps = VariantProps<typeof progressIndicatorVariants>;
declare function Progress({ className, children, value, variant, ...props }: ProgressPrimitive.Root.Props & ProgressVariantProps): React.ReactElement;
declare function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props): React.ReactElement;
declare function ProgressIndicator({ className, variant, ...props }: ProgressPrimitive.Indicator.Props & ProgressVariantProps): React.ReactElement;
declare function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props): React.ReactElement;
declare function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props): React.ReactElement;
export { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue, progressIndicatorVariants };
