import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import * as React from 'react';
declare function Combobox<Value, Multiple extends boolean | undefined = false>({ children, ...props }: ComboboxPrimitive.Root.Props<Value, Multiple>): React.ReactElement;
declare function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props): React.ReactElement;
declare const ComboboxTrigger: React.ForwardRefExoticComponent<Omit<import('@base-ui/react').ComboboxTriggerProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare function ComboboxInput({ className, children, disabled, showTrigger, showClear, ...props }: ComboboxPrimitive.Input.Props & {
    showTrigger?: boolean;
    showClear?: boolean;
}): React.ReactElement;
declare function ComboboxContent({ className, side, sideOffset, align, alignOffset, anchor: anchorProp, ...props }: ComboboxPrimitive.Popup.Props & Pick<ComboboxPrimitive.Positioner.Props, 'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor'>): React.ReactElement;
declare function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props): React.ReactElement;
declare function ComboboxItem({ className, children, title, ...props }: ComboboxPrimitive.Item.Props & {
    title?: string;
}): React.ReactElement;
declare function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props): React.ReactElement;
declare function ComboboxLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props): React.ReactElement;
declare function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props): React.ReactElement;
declare function ComboboxEmpty({ className, children, ...props }: ComboboxPrimitive.Empty.Props): React.ReactElement;
declare function ComboboxSeparator({ className, ...props }: ComboboxPrimitive.Separator.Props): React.ReactElement;
declare function ComboboxChips({ className, ...props }: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> & ComboboxPrimitive.Chips.Props): React.ReactElement;
declare function ComboboxChip({ className, children, title, showRemove, ...props }: ComboboxPrimitive.Chip.Props & {
    showRemove?: boolean;
    title?: string;
}): React.ReactElement;
declare function ComboboxChipsInput({ className, ...props }: ComboboxPrimitive.Input.Props): React.ReactElement;
declare function ComboboxListFooter({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function useComboboxAnchor(): React.RefObject<HTMLDivElement>;
export { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxGroup, ComboboxLabel, ComboboxCollection, ComboboxEmpty, ComboboxListFooter, ComboboxSeparator, ComboboxChips, ComboboxChip, ComboboxChipsInput, ComboboxTrigger, ComboboxValue, useComboboxAnchor, };
