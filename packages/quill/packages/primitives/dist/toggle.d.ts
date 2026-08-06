import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const toggleVariants: (props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "sm" | "lg" | "icon" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function Toggle({ className, variant, size, ...props }: TogglePrimitive.Props & VariantProps<typeof toggleVariants>): React.ReactElement;
export { Toggle, toggleVariants };
