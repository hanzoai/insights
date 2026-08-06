import { useRender } from '@base-ui/react/use-render';
import { VariantProps } from 'class-variance-authority';
import { Separator } from './separator';
import * as React from 'react';
declare const buttonGroupVariants: (props?: ({
    orientation?: "horizontal" | "vertical" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function ButtonGroup({ className, orientation, ...props }: React.ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>): React.ReactElement;
declare function ButtonGroupText({ className, render, ...props }: useRender.ComponentProps<'div'>): React.ReactElement;
declare function ButtonGroupSeparator({ className, orientation, ...props }: React.ComponentProps<typeof Separator>): React.ReactElement;
export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
