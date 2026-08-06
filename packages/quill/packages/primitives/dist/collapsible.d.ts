import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import * as React from 'react';
type CollapsibleVariant = 'default' | 'folder';
type CollapsibleProps = CollapsiblePrimitive.Root.Props & {
    variant?: CollapsibleVariant;
};
declare function Collapsible({ variant, className, ...props }: CollapsibleProps): React.ReactElement;
/**
 * Row container for the icon-only trigger pattern: the trigger toggles, while
 * siblings (a link, trailing count, actions) stay independently interactive.
 * Use `ms-auto` on trailing content so it stays end-aligned in RTL.
 */
declare function CollapsibleHeader({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function CollapsibleTrigger({ children, className, iconOnly, icon, ...props }: CollapsiblePrimitive.Trigger.Props & {
    /**
     * Renders the trigger as a compact icon button (just the chevron) instead
     * of a full-width row — pair with `CollapsibleHeader` so the rest of the
     * row can hold independently clickable content. `children` become the
     * trigger's screen-reader-only label.
     */
    iconOnly?: boolean;
    /**
     * Optional rest icon for `iconOnly` mode: shown instead of the chevron
     * until the surrounding `CollapsibleHeader` row is hovered or the trigger
     * is focused, then swaps to the chevron (Finder/VS Code tree pattern).
     */
    icon?: React.ReactNode;
}): React.ReactElement;
declare function CollapsibleContent({ children, className, ...props }: CollapsiblePrimitive.Panel.Props): React.ReactElement;
export { Collapsible, CollapsibleHeader, CollapsibleTrigger, CollapsibleContent };
