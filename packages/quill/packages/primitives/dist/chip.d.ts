import { VariantProps } from 'class-variance-authority';
import { Button, buttonVariants } from './button';
import { ButtonGroup, buttonGroupVariants } from './button-group';
import * as React from 'react';
type ChipProps = Omit<React.ComponentProps<typeof Button>, 'variant'> & Omit<VariantProps<typeof buttonVariants>, 'variant'>;
declare const Chip: React.ForwardRefExoticComponent<Omit<ChipProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const ChipClose: React.ForwardRefExoticComponent<Omit<Omit<import('./button').ButtonProps, "ref"> & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare function ChipGroup({ className, ...props }: React.ComponentProps<typeof ButtonGroup> & VariantProps<typeof buttonGroupVariants>): React.ReactElement;
export { Chip, ChipClose, ChipGroup };
