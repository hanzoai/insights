import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import * as React from 'react';
declare function TooltipProvider({ delay, ...props }: TooltipPrimitive.Provider.Props): React.ReactElement;
declare function Tooltip({ ...props }: TooltipPrimitive.Root.Props): React.ReactElement;
declare function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props): React.ReactElement;
declare function TooltipContent({ className, side, sideOffset, align, alignOffset, children, ...props }: TooltipPrimitive.Popup.Props & Pick<TooltipPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>): React.ReactElement;
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
