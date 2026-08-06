import { useRender } from '@base-ui/react/use-render';
import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const badgeVariants: (props?: ({
    variant?: "default" | "destructive" | "info" | "warning" | "success" | "completed" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function Badge({ className, variant, render, ...props }: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>): React.ReactElement;
export { Badge, badgeVariants };
