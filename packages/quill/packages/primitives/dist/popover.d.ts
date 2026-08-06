import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import * as React from 'react';
declare function Popover({ ...props }: PopoverPrimitive.Root.Props): React.ReactElement;
declare function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props): React.ReactElement;
declare function PopoverContent({ className, align, alignOffset, side, sideOffset, collisionAvoidance, container, ...props }: PopoverPrimitive.Popup.Props & Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionAvoidance'> & Pick<PopoverPrimitive.Portal.Props, 'container'>): React.ReactElement;
declare function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props): React.ReactElement;
declare function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props): React.ReactElement;
export { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger };
