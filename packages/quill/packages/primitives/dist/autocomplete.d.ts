import { Autocomplete as AutocompletePrimitive } from '@base-ui/react/autocomplete';
import * as React from 'react';
declare function Autocomplete<Value>({ children, autoHighlight, ...props }: AutocompletePrimitive.Root.Props<Value> & {
    items?: readonly Value[] | readonly {
        items: readonly Value[];
    }[];
}): React.ReactElement;
declare function AutocompleteValue({ ...props }: AutocompletePrimitive.Value.Props): React.ReactElement;
declare const AutocompleteTrigger: React.ForwardRefExoticComponent<Omit<import('@base-ui/react').AutocompleteTriggerProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare function AutocompleteClear({ className, ...props }: AutocompletePrimitive.Clear.Props): React.ReactElement;
declare function AutocompleteInput({ className, children, disabled, showSearchIcon, showClear, ...props }: AutocompletePrimitive.Input.Props & {
    /** Render the leading search icon (default true). */
    showSearchIcon?: boolean;
    /** Render the trailing clear button (default false). */
    showClear?: boolean;
}): React.ReactElement;
declare function AutocompleteContent({ className, side, sideOffset, align, alignOffset, anchor: anchorProp, ...props }: AutocompletePrimitive.Popup.Props & Pick<AutocompletePrimitive.Positioner.Props, 'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor'>): React.ReactElement;
declare function AutocompleteList({ className, ...props }: AutocompletePrimitive.List.Props): React.ReactElement;
declare function AutocompleteItem({ className, children, title, ...props }: AutocompletePrimitive.Item.Props & {
    title?: string;
}): React.ReactElement;
declare function AutocompleteGroup({ className, ...props }: AutocompletePrimitive.Group.Props): React.ReactElement;
declare function AutocompleteLabel({ className, ...props }: AutocompletePrimitive.GroupLabel.Props): React.ReactElement;
declare function AutocompleteCollection({ ...props }: AutocompletePrimitive.Collection.Props): React.ReactElement;
declare function AutocompleteEmpty({ className, children, ...props }: AutocompletePrimitive.Empty.Props): React.ReactElement;
declare function AutocompleteSeparator({ className, ...props }: AutocompletePrimitive.Separator.Props): React.ReactElement;
/**
 * Live region announcer that also renders visible status text. Default
 * content is "{count} results" pluralized; pass `emptyContent` to override
 * the zero-count state, or `children` (string / node / function) to fully
 * customize. `empty:hidden` collapses the element when there's nothing to
 * render so it doesn't take a row of space.
 *
 * Counts are derived via `Autocomplete.useFilteredItems()` from the parent
 * Root, so it works for flat *and* grouped item shapes.
 *
 * MUST be rendered inside `<Autocomplete>` — `useFilteredItems` reads from
 * Autocomplete's Root context and will throw if no provider is mounted.
 */
declare function AutocompleteStatus({ className, children, emptyContent, ...props }: Omit<AutocompletePrimitive.Status.Props, 'children'> & {
    /**
     * Override the default "{count} results" rendering. Pass a function to
     * receive the count; pass a node to render statically.
     */
    children?: React.ReactNode | ((count: number) => React.ReactNode);
    /** Rendered when the filtered count is zero. */
    emptyContent?: React.ReactNode;
}): React.ReactElement;
/**
 * Hook returning the anchor ref so consumers (e.g. an external trigger)
 * can position the popup against an arbitrary element.
 */
declare function useAutocompleteAnchor(): React.RefObject<HTMLDivElement>;
export { Autocomplete, AutocompleteClear, AutocompleteCollection, AutocompleteContent, AutocompleteEmpty, AutocompleteGroup, AutocompleteInput, AutocompleteItem, AutocompleteLabel, AutocompleteList, AutocompleteSeparator, AutocompleteStatus, AutocompleteTrigger, AutocompleteValue, useAutocompleteAnchor, };
