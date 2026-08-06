import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare function Empty({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare const emptyMediaVariants: (props?: ({
    variant?: "default" | "icon" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function EmptyMedia({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>): React.ReactElement;
declare function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>): React.ReactElement;
declare function EmptyContent({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia };
