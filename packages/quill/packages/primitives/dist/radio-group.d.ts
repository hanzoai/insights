import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';
import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const radioIndicatorVariants: (props?: ({
    size?: "default" | "sm" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function RadioIndicator({ checked, className, size, }: {
    checked?: boolean;
    className?: string;
} & VariantProps<typeof radioIndicatorVariants>): React.ReactElement;
declare function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props): React.ReactElement;
declare const radioGroupItemVariants: (props?: ({
    size?: "default" | "sm" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function RadioGroupItem({ className, size, ...props }: RadioPrimitive.Root.Props & VariantProps<typeof radioGroupItemVariants>): React.ReactElement;
export { RadioGroup, RadioGroupItem, RadioIndicator };
