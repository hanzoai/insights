import { useRender } from '@base-ui/react/use-render';
import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const headingVariants: (props?: ({
    size?: "base" | "sm" | "lg" | "2xl" | "xl" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function Heading({ className, size, render, ...props }: useRender.ComponentProps<'h2'> & VariantProps<typeof headingVariants>): React.ReactElement;
export { Heading, headingVariants };
