import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { Kbd } from './kbd';
import * as React from 'react';
declare function DropdownMenu({ ...props }: MenuPrimitive.Root.Props): React.ReactElement;
declare function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props): React.ReactElement;
declare function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props): React.ReactElement;
declare function DropdownMenuContent({ align, alignOffset, side, sideOffset, className, anchor, children, ...props }: MenuPrimitive.Popup.Props & Pick<MenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'anchor'>): React.ReactElement;
declare function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props): React.ReactElement;
declare function DropdownMenuLabel({ className, inset, ...props }: MenuPrimitive.GroupLabel.Props & {
    inset?: boolean;
}): React.ReactElement;
declare function DropdownMenuItem({ className, inset, variant, ...props }: MenuPrimitive.Item.Props & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
}): React.ReactElement;
declare function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props): React.ReactElement;
declare function DropdownMenuSubTrigger({ className, inset, children, ...props }: MenuPrimitive.SubmenuTrigger.Props & {
    inset?: boolean;
}): React.ReactElement;
declare function DropdownMenuSubContent({ align, alignOffset, side, sideOffset, className, ...props }: React.ComponentProps<typeof DropdownMenuContent>): React.ReactElement;
declare function DropdownMenuCheckboxItem({ className, children, checked, inset, ...props }: MenuPrimitive.CheckboxItem.Props & {
    inset?: boolean;
}): React.ReactElement;
declare function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props): React.ReactElement;
declare function DropdownMenuRadioItem({ className, children, inset, ...props }: MenuPrimitive.RadioItem.Props & {
    inset?: boolean;
}): React.ReactElement;
declare function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props): React.ReactElement;
/**
 * Tri-state for a select-all action over a list of selectable values.
 *  - `none`: nothing selected
 *  - `some`: at least one but not all selected (indeterminate)
 *  - `all`:  every value selected
 */
type SelectAllState = 'none' | 'some' | 'all';
type UseSelectAllResult = {
    state: SelectAllState;
    isAllSelected: boolean;
    toggle: () => void;
};
/**
 * Headless hook for a "select all / deselect all" action paired with a list
 * of `DropdownMenuCheckboxItem`s. Consumer owns rendering and stays in
 * control of the selection state.
 *
 * Comparison is reference equality unless `getKey` is supplied — pass a key
 * extractor when `values` are objects whose identity isn't stable across
 * renders (e.g. fetched from an API).
 *
 * @example
 * const ALL = ['a', 'b', 'c']
 * const [selected, setSelected] = useState<string[]>([])
 * const { isAllSelected, toggle } = useDropdownMenuSelectAll(ALL, selected, setSelected)
 *
 * <DropdownMenuItem closeOnClick={false} onClick={toggle}>
 *     {isAllSelected ? 'Deselect all' : 'Select all'}
 * </DropdownMenuItem>
 */
declare function useDropdownMenuSelectAll<T>(values: readonly T[], selected: readonly T[], onChange: (next: T[]) => void, getKey?: (value: T) => string | number): UseSelectAllResult;
/**
 * Convenience component that renders a `DropdownMenuItem` whose label flips
 * between `selectLabel` ("Select all") and `deselectLabel` ("Deselect all")
 * based on the current selection state. The menu stays open after toggle so
 * users can keep adjusting items.
 *
 * For full control, use `useDropdownMenuSelectAll` directly and render your
 * own item — or pass a render-prop child:
 *
 * @example
 * <DropdownMenuSelectAll values={ALL} selected={selected} onChange={setSelected} />
 *
 * <DropdownMenuSelectAll values={ALL} selected={selected} onChange={setSelected}>
 *     {({ state, toggle }) => (
 *         <DropdownMenuItem closeOnClick={false} onClick={toggle}>
 *             {state === 'all' ? 'Clear' : 'Pick everything'}
 *             {state === 'some' && ' (partial)'}
 *         </DropdownMenuItem>
 *     )}
 * </DropdownMenuSelectAll>
 */
declare function DropdownMenuSelectAll<T>({ values, selected, onChange, getKey, selectLabel, deselectLabel, children, ...itemProps }: {
    values: readonly T[];
    selected: readonly T[];
    onChange: (next: T[]) => void;
    getKey?: (value: T) => string | number;
    selectLabel?: React.ReactNode;
    deselectLabel?: React.ReactNode;
    children?: (result: UseSelectAllResult) => React.ReactNode;
} & Omit<React.ComponentProps<typeof DropdownMenuItem>, 'children' | 'onClick' | 'onChange' | 'closeOnClick' | 'data-state'>): React.ReactElement;
declare function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<typeof Kbd>): React.ReactElement;
export { DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSelectAll, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, useDropdownMenuSelectAll, };
export type { SelectAllState, UseSelectAllResult };
