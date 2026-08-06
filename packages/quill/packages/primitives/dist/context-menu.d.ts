import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';
import { Kbd } from './kbd';
import * as React from 'react';
declare function ContextMenu({ ...props }: ContextMenuPrimitive.Root.Props): React.ReactElement;
declare function ContextMenuPortal({ ...props }: ContextMenuPrimitive.Portal.Props): React.ReactElement;
declare function ContextMenuTrigger({ className, ...props }: ContextMenuPrimitive.Trigger.Props): React.ReactElement;
declare function ContextMenuContent({ className, align, alignOffset, side, sideOffset, children, ...props }: ContextMenuPrimitive.Popup.Props & Pick<ContextMenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>): React.ReactElement;
declare function ContextMenuGroup({ ...props }: ContextMenuPrimitive.Group.Props): React.ReactElement;
declare function ContextMenuLabel({ className, inset, ...props }: ContextMenuPrimitive.GroupLabel.Props & {
    inset?: boolean;
}): React.ReactElement;
declare function ContextMenuItem({ className, inset, variant, children, ...props }: ContextMenuPrimitive.Item.Props & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
}): React.ReactElement;
declare function ContextMenuSub({ ...props }: ContextMenuPrimitive.SubmenuRoot.Props): React.ReactElement;
declare function ContextMenuSubTrigger({ className, inset, children, ...props }: ContextMenuPrimitive.SubmenuTrigger.Props & {
    inset?: boolean;
}): React.ReactElement;
declare function ContextMenuSubContent({ className, align, alignOffset, side, sideOffset, ...props }: React.ComponentProps<typeof ContextMenuContent>): React.ReactElement;
declare function ContextMenuCheckboxItem({ className, children, checked, inset, ...props }: ContextMenuPrimitive.CheckboxItem.Props & {
    inset?: boolean;
}): React.ReactElement;
declare function ContextMenuRadioGroup({ ...props }: ContextMenuPrimitive.RadioGroup.Props): React.ReactElement;
declare function ContextMenuRadioItem({ className, children, inset, ...props }: ContextMenuPrimitive.RadioItem.Props & {
    inset?: boolean;
}): React.ReactElement;
declare function ContextMenuSeparator({ className, ...props }: ContextMenuPrimitive.Separator.Props): React.ReactElement;
declare function ContextMenuShortcut({ className, ...props }: React.ComponentProps<typeof Kbd>): React.ReactElement;
export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup, ContextMenuPortal, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuRadioGroup, };
