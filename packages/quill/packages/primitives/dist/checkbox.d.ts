import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const checkboxIndicatorVariants: (props?: ({
    size?: "default" | "sm" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function CheckboxIndicator({ checked, className, size, }: {
    checked?: boolean;
    className?: string;
} & VariantProps<typeof checkboxIndicatorVariants>): React.ReactElement;
declare const checkboxVariants: (props?: ({
    size?: "default" | "sm" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function Checkbox({ className, size, ...props }: CheckboxPrimitive.Root.Props & VariantProps<typeof checkboxVariants>): React.ReactElement;
export { Checkbox, CheckboxIndicator };
