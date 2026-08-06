import { useRender } from '@base-ui/react/use-render';
import { VariantProps } from 'class-variance-authority';
import { Separator } from './separator';
import * as React from 'react';
declare function ItemGroup({ className, combined, ...props }: React.ComponentProps<'div'> & {
    combined?: boolean;
}): React.ReactElement;
declare function ItemSeparator({ className, ...props }: React.ComponentProps<typeof Separator>): React.ReactElement;
declare const itemVariants: (props?: ({
    variant?: "default" | "outline" | "muted" | "pressable" | "menuItem" | null | undefined;
    size?: "default" | "xs" | "sm" | null | undefined;
    tone?: "default" | "destructive" | "info" | "warning" | "success" | "completed" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function Item({ className, variant, size, tone, role, render, ...props }: useRender.ComponentProps<'div'> & VariantProps<typeof itemVariants>): React.ReactElement;
declare const ItemMenuItem: React.ForwardRefExoticComponent<Omit<Omit<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "ref"> & {
    ref?: ((instance: HTMLButtonElement | null) => void | React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES]) | React.RefObject<HTMLButtonElement> | null | undefined;
} & {
    render?: React.ReactElement<any, string | React.JSXElementConstructor<any>> | import('@base-ui/react').ComponentRenderFn<import('@base-ui/react').HTMLProps, {}> | undefined;
} & VariantProps<(props?: ({
    variant?: "default" | "outline" | "muted" | "pressable" | "menuItem" | null | undefined;
    size?: "default" | "xs" | "sm" | null | undefined;
    tone?: "default" | "destructive" | "info" | "warning" | "success" | "completed" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const ItemCheckbox: React.ForwardRefExoticComponent<Omit<Omit<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "ref"> & {
    ref?: ((instance: HTMLButtonElement | null) => void | React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES]) | React.RefObject<HTMLButtonElement> | null | undefined;
} & {
    render?: React.ReactElement<any, string | React.JSXElementConstructor<any>> | import('@base-ui/react').ComponentRenderFn<import('@base-ui/react').HTMLProps, {}> | undefined;
} & VariantProps<(props?: ({
    variant?: "default" | "outline" | "muted" | "pressable" | "menuItem" | null | undefined;
    size?: "default" | "xs" | "sm" | null | undefined;
    tone?: "default" | "destructive" | "info" | "warning" | "success" | "completed" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const ItemRadio: React.ForwardRefExoticComponent<Omit<Omit<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "ref"> & {
    ref?: ((instance: HTMLButtonElement | null) => void | React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES]) | React.RefObject<HTMLButtonElement> | null | undefined;
} & {
    render?: React.ReactElement<any, string | React.JSXElementConstructor<any>> | import('@base-ui/react').ComponentRenderFn<import('@base-ui/react').HTMLProps, {}> | undefined;
} & VariantProps<(props?: ({
    variant?: "default" | "outline" | "muted" | "pressable" | "menuItem" | null | undefined;
    size?: "default" | "xs" | "sm" | null | undefined;
    tone?: "default" | "destructive" | "info" | "warning" | "success" | "completed" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const itemMediaVariants: (props?: ({
    variant?: "image" | "checkbox" | "default" | "icon" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function ItemMedia({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>): React.ReactElement;
declare const itemContentVariants: (props?: ({
    variant?: "default" | "menuItem" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function ItemContent({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof itemContentVariants>): React.ReactElement;
declare function ItemTitle({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function ItemDescription({ className, ...props }: React.ComponentProps<'p'>): React.ReactElement;
declare function ItemActions({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function ItemHeader({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function ItemFooter({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
export { Item, ItemCheckbox, ItemRadio, ItemMenuItem, ItemMedia, ItemContent, ItemActions, ItemGroup, ItemSeparator, ItemTitle, ItemDescription, ItemHeader, ItemFooter, };
