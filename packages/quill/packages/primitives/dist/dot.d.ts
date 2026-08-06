import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const dotVariants: (props?: ({
    variant?: "default" | "destructive" | "info" | "warning" | "success" | null | undefined;
    pulse?: boolean | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function Dot({ className, variant, pulse, ...props }: React.ComponentProps<'span'> & VariantProps<typeof dotVariants>): React.ReactElement;
export { Dot, dotVariants };
