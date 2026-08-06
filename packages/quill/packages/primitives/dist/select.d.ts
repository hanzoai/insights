import { Select as SelectPrimitive } from '@base-ui/react/select';
import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';
declare const Select: typeof SelectPrimitive.Root;
declare function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props): React.ReactElement;
declare function SelectValue({ className, ...props }: SelectPrimitive.Value.Props): React.ReactElement;
declare function SelectTriggerIcon({ className, ...props }: React.ComponentProps<typeof ChevronDownIcon>): React.ReactElement;
declare function SelectTrigger({ className, size, children, ...props }: SelectPrimitive.Trigger.Props & {
    size?: 'sm' | 'default';
}): React.ReactElement;
declare function SelectContent({ className, children, side, sideOffset, align, alignOffset, alignItemWithTrigger, ...props }: SelectPrimitive.Popup.Props & Pick<SelectPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'alignItemWithTrigger'>): React.ReactElement;
declare function SelectGroupLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props): React.ReactElement;
declare function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props): React.ReactElement;
declare function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props): React.ReactElement;
declare function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>): React.ReactElement;
declare function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>): React.ReactElement;
export { Select, SelectContent, SelectGroup, SelectGroupLabel, SelectItem, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectTriggerIcon, SelectValue, };
