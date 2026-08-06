import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const buttonVariants: (props?: ({
    variant?: "link" | "default" | "primary" | "outline" | "destructive" | "link-muted" | null | undefined;
    size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | null | undefined;
    focusableWhenDisabled?: boolean | null | undefined;
    left?: boolean | null | undefined;
    inert?: boolean | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
export type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & {
    /** Hides the label under a centered spinner and disables the button. Width stays stable. */
    loading?: boolean;
};
declare const Button: React.ForwardRefExoticComponent<Omit<ButtonProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export { Button, buttonVariants };
