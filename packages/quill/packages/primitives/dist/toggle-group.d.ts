import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import { VariantProps } from 'class-variance-authority';
import { toggleVariants } from './toggle';
import * as React from 'react';
declare function ToggleGroup({ className, variant, size, spacing, orientation, children, ...props }: ToggleGroupPrimitive.Props & VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: 'horizontal' | 'vertical';
}): React.ReactElement;
declare function ToggleGroupItem({ className, children, variant, size, ...props }: TogglePrimitive.Props & VariantProps<typeof toggleVariants>): React.ReactElement;
export { ToggleGroup, ToggleGroupItem };
