import { NumberField } from '@base-ui/react/number-field';
import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const InputGroup: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const inputGroupAddonVariants: (props?: ({
    align?: "inline-start" | "inline-end" | "block-start" | "block-end" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function InputGroupAddon({ className, align, ...props }: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>): React.ReactElement;
declare const InputGroupButton: React.ForwardRefExoticComponent<Omit<Omit<Omit<import('./button').ButtonProps, "ref"> & React.RefAttributes<HTMLButtonElement>, "size" | "type"> & VariantProps<(props?: ({
    size?: "xs" | "sm" | "icon-xs" | "icon-sm" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string> & {
    type?: "button" | "submit" | "reset";
}, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare function InputGroupText({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
declare const InputGroupInput: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "ref"> & React.RefAttributes<HTMLInputElement>>;
declare function InputGroupTextarea({ className, ...props }: React.ComponentProps<'textarea'>): React.ReactElement;
interface InputGroupNumberInputProps extends Omit<NumberField.Root.Props, 'className' | 'children'> {
    className?: string;
    inputRef?: React.Ref<HTMLInputElement>;
}
declare function InputGroupNumberInput({ className, inputRef, ...rootProps }: InputGroupNumberInputProps): React.ReactElement;
export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupInput, InputGroupNumberInput, InputGroupTextarea };
