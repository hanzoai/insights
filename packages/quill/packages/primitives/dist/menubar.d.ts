import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { Menubar as MenubarPrimitive } from '@base-ui/react/menubar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './dropdown-menu';
import * as React from 'react';
declare function Menubar({ className, ...props }: MenubarPrimitive.Props): React.ReactElement;
declare function MenubarMenu({ ...props }: React.ComponentProps<typeof DropdownMenu>): React.ReactElement;
declare function MenubarGroup({ ...props }: React.ComponentProps<typeof DropdownMenuGroup>): React.ReactElement;
declare function MenubarPortal({ ...props }: React.ComponentProps<typeof DropdownMenuPortal>): React.ReactElement;
declare function MenubarTrigger({ className, ...props }: React.ComponentProps<typeof DropdownMenuTrigger>): React.ReactElement;
declare function MenubarContent({ className, align, alignOffset, sideOffset, ...props }: React.ComponentProps<typeof DropdownMenuContent>): React.ReactElement;
declare function MenubarItem({ className, inset, variant, ...props }: React.ComponentProps<typeof DropdownMenuItem>): React.ReactElement;
declare function MenubarCheckboxItem({ className, children, checked, inset, ...props }: MenuPrimitive.CheckboxItem.Props & {
    inset?: boolean;
}): React.ReactElement;
declare function MenubarRadioGroup({ ...props }: React.ComponentProps<typeof DropdownMenuRadioGroup>): React.ReactElement;
declare function MenubarRadioItem({ className, children, inset, ...props }: MenuPrimitive.RadioItem.Props & {
    inset?: boolean;
}): React.ReactElement;
declare function MenubarLabel({ className, inset, ...props }: React.ComponentProps<typeof DropdownMenuLabel> & {
    inset?: boolean;
}): React.ReactElement;
declare function MenubarSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuSeparator>): React.ReactElement;
declare function MenubarShortcut({ className, ...props }: React.ComponentProps<typeof DropdownMenuShortcut>): React.ReactElement;
declare function MenubarSub({ ...props }: React.ComponentProps<typeof DropdownMenuSub>): React.ReactElement;
declare function MenubarSubTrigger({ className, inset, ...props }: React.ComponentProps<typeof DropdownMenuSubTrigger> & {
    inset?: boolean;
}): React.ReactElement;
declare function MenubarSubContent({ className, ...props }: React.ComponentProps<typeof DropdownMenuSubContent>): React.ReactElement;
export { Menubar, MenubarPortal, MenubarMenu, MenubarTrigger, MenubarContent, MenubarGroup, MenubarSeparator, MenubarLabel, MenubarItem, MenubarShortcut, MenubarCheckboxItem, MenubarRadioGroup, MenubarRadioItem, MenubarSub, MenubarSubTrigger, MenubarSubContent, };
