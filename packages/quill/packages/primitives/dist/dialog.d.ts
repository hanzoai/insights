import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useRender } from '@base-ui/react/use-render';
import * as React from 'react';
/** Note: if you're nesting dialogs, in order for you to click the overlay to close it, you must pass 'mounted: true' to the nested dialog*/
declare function Dialog({ ...props }: DialogPrimitive.Root.Props): React.ReactElement;
declare function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props): React.ReactElement;
declare function DialogPortal({ ...props }: DialogPrimitive.Portal.Props): React.ReactElement;
declare function DialogClose({ ...props }: DialogPrimitive.Close.Props): React.ReactElement;
declare function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props): React.ReactElement;
declare function DialogContent({ className, children, showCloseButton, nested, size, ...props }: DialogPrimitive.Popup.Props & {
    showCloseButton?: boolean;
    nested?: boolean;
    /**
     * Width variant. Defaults to the standard ~24rem dialog width
     * (Quill's existing media-query clamp at ≥640px viewports).
     *   - `'wide'`: clamps to `min(72rem, calc(100vw - 3rem))` for
     *     content that needs horizontal breathing room (data tables,
     *     side-by-side editors, etc.).
     *   - `'full'`: drops the desktop clamp entirely and grows to
     *     `calc(100vw - 3rem)`.
     */
    size?: 'wide' | 'full';
}): React.ReactElement;
declare function DialogHeader({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function DialogFooter({ className, showCloseButton, children, ...props }: React.ComponentProps<'div'> & {
    showCloseButton?: boolean;
}): React.ReactElement;
declare function DialogBody({ className, render, children, viewportClassName, ...props }: useRender.ComponentProps<'div'> & {
    /**
     * Class applied to the inner ScrollArea viewport (`data-slot="scroll-area-viewport"`),
     * the element that actually scrolls. For example, `viewportClassName="p-0"` drops the
     * default body padding for full-bleed content. Ignored when a custom `render` is
     * supplied (set `viewportClassName` on your own `<ScrollArea>` there instead).
     */
    viewportClassName?: string;
}): React.ReactElement;
declare function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props): React.ReactElement;
declare function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props): React.ReactElement;
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogBody, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, };
