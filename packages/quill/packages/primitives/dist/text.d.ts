import { useRender } from '@base-ui/react/use-render';
import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const textVariants: (props?: ({
    size?: "xxs" | "base" | "xs" | "sm" | "lg" | null | undefined;
    variant?: "default" | "destructive" | "muted" | null | undefined;
    weight?: "normal" | "medium" | "semibold" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function Text({ className, size, variant, weight, render, ...props }: useRender.ComponentProps<'p'> & VariantProps<typeof textVariants>): React.ReactElement;
export { Text, textVariants };
