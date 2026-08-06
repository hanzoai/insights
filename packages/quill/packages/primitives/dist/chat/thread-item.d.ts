import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { Toolbar as ToolbarPrimitive } from '@base-ui/react/toolbar';
import { useRender } from '@base-ui/react/use-render';
import { ButtonProps } from '../button';
import { TooltipContent } from '../tooltip';
import * as React from 'react';
/**
 * Thread item primitives — a feed-style message row (avatar gutter, author + timestamp header,
 * body, reaction pills, reply summary, hover-revealed actions toolbar). Complements the bubble
 * primitives in {@link ./chat-bubble}: bubbles for conversational back-and-forth, thread items
 * for channel/feed surfaces where every message aligns start and actions appear on hover.
 *
 * Anatomy:
 *   ThreadItemGroup
 *     ThreadItem (article)
 *       ThreadItemGutter > Avatar (or ThreadItemTimestamp on continuation rows — shown on hover)
 *       ThreadItemContent
 *         ThreadItemHeader > ThreadItemAuthor + [Badge/meta] + ThreadItemTimestamp
 *         ThreadItemBody > text + ThreadItemMention + ThreadItemLink
 *         ThreadItemAttachment > ThreadItemAttachmentTrigger + ThreadItemAttachmentContent > ThreadItemAttachmentImage
 *         ThreadItemReactions > ThreadItemReaction > ThreadItemReactionEmoji + count
 *         ThreadItemReplies > AvatarGroup + ThreadItemRepliesLabel + ThreadItemRepliesMeta
 *       ThreadItemActions > ThreadItemAction(...)
 */
declare function ThreadItemGroup({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function ThreadItem({ className, ...props }: React.ComponentProps<'article'>): React.ReactElement;
declare function ThreadItemGutter({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function ThreadItemContent({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function ThreadItemHeader({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
/** Author name. Renders a `span` by default; pass `render={<button />}` to make it a profile trigger. */
declare function ThreadItemAuthor({ className, render, ...props }: useRender.ComponentProps<'span'>): React.ReactElement;
/** Semantic `<time>` — pass `dateTime` so assistive tech gets the machine-readable value. */
declare function ThreadItemTimestamp({ className, ...props }: React.ComponentProps<'time'>): React.ReactElement;
declare function ThreadItemBody({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
/**
 * Inline @mention pill inside {@link ThreadItemBody}. Renders a `span` by default; pass
 * `render={<button type="button" />}` (or `<a />`) when clicking it should open a profile.
 */
declare function ThreadItemMention({ className, render, ...props }: useRender.ComponentProps<'span'>): React.ReactElement;
/** Inline link inside {@link ThreadItemBody} — primary color, underline on hover. */
declare function ThreadItemLink({ className, render, ...props }: useRender.ComponentProps<'a'>): React.ReactElement;
/**
 * Collapsible attachment (image/file preview) — a Base UI Collapsible, open by default. The
 * trigger carries the filename and a rotating chevron; keyboard/AT get `aria-expanded` for free.
 */
declare function ThreadItemAttachment({ className, defaultOpen, ...props }: CollapsiblePrimitive.Root.Props): React.ReactElement;
/** Filename row that toggles the attachment preview. Children become the visible label. */
declare function ThreadItemAttachmentTrigger({ children, className, ...props }: CollapsiblePrimitive.Trigger.Props): React.ReactElement;
declare function ThreadItemAttachmentContent({ children, className, ...props }: CollapsiblePrimitive.Panel.Props): React.ReactElement;
/** Framed image preview. `alt` is required — describe the image (empty `alt=""` only if purely decorative). */
declare function ThreadItemAttachmentImage({ className, alt, ...props }: React.ComponentProps<'img'> & {
    alt: string;
}): React.ReactElement;
declare function ThreadItemReactions({ className, 'aria-label': ariaLabel, ...props }: React.ComponentProps<'div'>): React.ReactElement;
/**
 * A reaction pill — a Base UI Toggle, so `pressed`/`onPressedChange` and `aria-pressed` come for
 * free. Give it an `aria-label` naming the emoji and count ("victory hand, 1 reaction"); wrap the
 * emoji glyph in {@link ThreadItemReactionEmoji} so it stays out of the accessible name.
 */
declare const ThreadItemReaction: React.ForwardRefExoticComponent<Omit<TogglePrimitive.Props<string>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
/** Decorative emoji glyph inside a reaction — hidden from the accessible name. */
declare function ThreadItemReactionEmoji({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
/**
 * Hover-revealed actions toolbar, anchored to the item's top end corner. A Base UI Toolbar, so it
 * is one tab stop with arrow-key roving focus between actions. Hidden with opacity (not
 * `display: none`) so it stays keyboard-reachable — focus reveals it via `:focus-within`. Carries
 * its own `TooltipProvider`, so {@link ThreadItemAction} tooltips work without app-root setup and
 * moving between adjacent actions shares the provider's warm-up delay.
 */
declare function ThreadItemActions({ className, 'aria-label': ariaLabel, ...props }: ToolbarPrimitive.Root.Props): React.ReactElement;
/**
 * One icon action: a Button wrapped in a Tooltip. `label` is both the accessible name
 * (`aria-label`) and the tooltip content — one source of truth, so the tooltip can never drift
 * from what screen readers announce. Forwards all Button props, including `render`
 * (`render={<a href="…" />}` for a link action), and its ref reaches the underlying button — so it
 * works as a `render` target itself (e.g. `DropdownMenuTrigger render={<ThreadItemAction …/>}`).
 * Inside {@link ThreadItemActions} it joins the toolbar's roving focus and the tooltip provider is
 * built in; anywhere else (e.g. a reactions row) it needs a `TooltipProvider` ancestor.
 */
declare const ThreadItemAction: React.ForwardRefExoticComponent<Omit<import('@base-ui/react').ButtonProps & import('class-variance-authority').VariantProps<(props?: ({
    variant?: "link" | "default" | "primary" | "outline" | "destructive" | "link-muted" | null | undefined;
    size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | null | undefined;
    focusableWhenDisabled?: boolean | null | undefined;
    left?: boolean | null | undefined;
    inert?: boolean | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string> & {
    loading?: boolean;
} & {
    label: string;
    tooltipSide?: React.ComponentProps<typeof TooltipContent>["side"];
}, "ref"> & React.RefAttributes<HTMLButtonElement>>;
/**
 * Reply summary row — a Button (variant `default`: transparent at rest, fill on hover), stretched
 * to the content column. Opens the thread on click; pass `render={<a />}` for a link.
 */
declare function ThreadItemReplies({ className, ...props }: ButtonProps): React.ReactElement;
declare function ThreadItemRepliesLabel({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
declare function ThreadItemRepliesMeta({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
export { ThreadItemGroup, ThreadItem, ThreadItemGutter, ThreadItemContent, ThreadItemHeader, ThreadItemAuthor, ThreadItemTimestamp, ThreadItemBody, ThreadItemMention, ThreadItemLink, ThreadItemAttachment, ThreadItemAttachmentTrigger, ThreadItemAttachmentContent, ThreadItemAttachmentImage, ThreadItemReactions, ThreadItemReaction, ThreadItemReactionEmoji, ThreadItemActions, ThreadItemAction, ThreadItemReplies, ThreadItemRepliesLabel, ThreadItemRepliesMeta, };
