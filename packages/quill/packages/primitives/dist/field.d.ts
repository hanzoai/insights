import { VariantProps } from 'class-variance-authority';
import { Label } from './label';
import * as React from 'react';
declare function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>): React.ReactElement;
declare function FieldLegend({ className, variant, ...props }: React.ComponentProps<'legend'> & {
    variant?: 'legend' | 'label';
}): React.ReactElement;
declare function FieldGroup({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare const fieldVariants: (props?: ({
    orientation?: "horizontal" | "vertical" | "responsive" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function Field({ className, orientation, ...props }: React.ComponentProps<'div'> & VariantProps<typeof fieldVariants>): React.ReactElement;
declare function FieldContent({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>): React.ReactElement;
declare function FieldTitle({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function FieldDescription({ className, ...props }: React.ComponentProps<'p'>): React.ReactElement;
declare function FieldSeparator({ children, className, ...props }: React.ComponentProps<'div'> & {
    children?: React.ReactNode;
}): React.ReactElement;
declare function FieldError({ className, children, errors, ...props }: React.ComponentProps<'div'> & {
    errors?: Array<{
        message?: string;
    } | undefined>;
}): React.ReactElement | null;
export { Field, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldLegend, FieldSeparator, FieldSet, FieldContent, FieldTitle, };
