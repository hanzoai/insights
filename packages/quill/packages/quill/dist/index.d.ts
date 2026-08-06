import { Accordion as Accordion_2 } from '@base-ui/react/accordion';
import { AlertDialog as AlertDialog_2 } from '@base-ui/react/alert-dialog';
import { Autocomplete as Autocomplete_2 } from '@base-ui/react/autocomplete';
import { AutocompleteTriggerProps } from '@base-ui/react';
import { AvatarFallbackProps } from '@base-ui/react';
import { AvatarImageProps } from '@base-ui/react';
import { AvatarRootProps } from '@base-ui/react';
import { Button as Button_2 } from '@base-ui/react/button';
import { ButtonProps as ButtonProps_2 } from '@base-ui/react';
import { Checkbox as Checkbox_2 } from '@base-ui/react/checkbox';
import { ChevronDownIcon } from 'lucide-react';
import { ClassProp } from 'class-variance-authority/types';
import { ClassValue } from 'clsx';
import { Collapsible as Collapsible_2 } from '@base-ui/react/collapsible';
import { ColumnDef } from '@tanstack/react-table';
import { Combobox as Combobox_2 } from '@base-ui/react';
import { ComboboxTriggerProps } from '@base-ui/react';
import { ComponentRenderFn } from '@base-ui/react';
import { ContextMenu as ContextMenu_2 } from '@base-ui/react/context-menu';
import { Dialog as Dialog_2 } from '@base-ui/react/dialog';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Drawer as Drawer_2 } from '@base-ui/react/drawer';
import { HTMLProps } from '@base-ui/react';
import { Menu } from '@base-ui/react/menu';
import { Menubar as Menubar_2 } from '@base-ui/react/menubar';
import { MessageScroller } from '@shadcn/react/message-scroller';
import { NumberField } from '@base-ui/react/number-field';
import { NumberFieldInputProps } from '@base-ui/react';
import { Popover as Popover_2 } from '@base-ui/react/popover';
import { Progress as Progress_2 } from '@base-ui/react/progress';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup as RadioGroup_2 } from '@base-ui/react/radio-group';
import * as React_2 from 'react';
import * as ResizablePrimitive from 'react-resizable-panels';
import { ScrollArea as ScrollArea_2 } from '@base-ui/react/scroll-area';
import { Select as Select_2 } from '@base-ui/react/select';
import { Separator as Separator_2 } from '@base-ui/react/separator';
import { Slider as Slider_2 } from '@base-ui/react/slider';
import { Switch as Switch_2 } from '@base-ui/react/switch';
import { Tabs as Tabs_2 } from '@base-ui/react/tabs';
import { ToastManager } from '@base-ui/react';
import { Toggle as Toggle_2 } from '@base-ui/react/toggle';
import { ToggleGroup as ToggleGroup_2 } from '@base-ui/react/toggle-group';
import { Toolbar } from '@base-ui/react/toolbar';
import { Tooltip as Tooltip_2 } from '@base-ui/react/tooltip';
import { useMessageScroller as useChatMessageScroller } from '@shadcn/react/message-scroller';
import { useMessageScrollerScrollable as useChatMessageScrollerScrollable } from '@shadcn/react/message-scroller';
import { useMessageScrollerVisibility as useChatMessageScrollerVisibility } from '@shadcn/react/message-scroller';
import { useDirection } from '@base-ui/react/direction-provider';
import { useRender } from '@base-ui/react/use-render';
import { VariantProps } from 'class-variance-authority';

export declare function Accordion({ className, ...props }: Accordion_2.Root.Props): React_2.ReactElement;

export declare function AccordionContent({ className, children, ...props }: Accordion_2.Panel.Props): React_2.ReactElement;

export declare function AccordionItem({ className, ...props }: Accordion_2.Item.Props): React_2.ReactElement;

export declare function AccordionTrigger({ className, children, ...props }: Accordion_2.Trigger.Props): React_2.ReactElement;

export declare function AlertDialog({ ...props }: AlertDialog_2.Root.Props): React_2.ReactElement;

export declare function AlertDialogClose({ ...props }: AlertDialog_2.Close.Props): React_2.ReactElement;

export declare function AlertDialogContent({ className, children, ...props }: AlertDialog_2.Popup.Props): React_2.ReactElement;

export declare function AlertDialogDescription({ className, ...props }: AlertDialog_2.Description.Props): React_2.ReactElement;

export declare function AlertDialogFooter({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function AlertDialogHeader({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function AlertDialogOverlay({ className, ...props }: AlertDialog_2.Backdrop.Props): React_2.ReactElement;

export declare function AlertDialogPortal({ ...props }: AlertDialog_2.Portal.Props): React_2.ReactElement;

export declare function AlertDialogTitle({ className, ...props }: AlertDialog_2.Title.Props): React_2.ReactElement;

export declare function AlertDialogTrigger({ ...props }: AlertDialog_2.Trigger.Props): React_2.ReactElement;

declare type Align = 'left' | 'center' | 'right';

export declare function anchoredToast(options: AnchoredToastOptions): string;

export declare namespace anchoredToast {
    var dismiss: (id: string) => void;
}

export declare const anchoredToastManager: ToastManager<ToastActionData>;

export declare type AnchoredToastOptions = ToastOptions & {
    anchor: Element | null;
    side?: 'top' | 'bottom' | 'left' | 'right';
    sideOffset?: number;
    onClose?: () => void;
};

export declare function Autocomplete<Value>({ children, autoHighlight, ...props }: Autocomplete_2.Root.Props<Value> & {
    items?: readonly Value[] | readonly {
        items: readonly Value[];
    }[];
}): React_2.ReactElement;

export declare function AutocompleteClear({ className, ...props }: Autocomplete_2.Clear.Props): React_2.ReactElement;

export declare function AutocompleteCollection({ ...props }: Autocomplete_2.Collection.Props): React_2.ReactElement;

export declare function AutocompleteContent({ className, side, sideOffset, align, alignOffset, anchor: anchorProp, ...props }: Autocomplete_2.Popup.Props & Pick<Autocomplete_2.Positioner.Props, 'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor'>): React_2.ReactElement;

export declare function AutocompleteEmpty({ className, children, ...props }: Autocomplete_2.Empty.Props): React_2.ReactElement;

export declare function AutocompleteGroup({ className, ...props }: Autocomplete_2.Group.Props): React_2.ReactElement;

export declare function AutocompleteInput({ className, children, disabled, showSearchIcon, showClear, ...props }: Autocomplete_2.Input.Props & {
    /** Render the leading search icon (default true). */
    showSearchIcon?: boolean;
    /** Render the trailing clear button (default false). */
    showClear?: boolean;
}): React_2.ReactElement;

export declare function AutocompleteItem({ className, children, title, ...props }: Autocomplete_2.Item.Props & {
    title?: string;
}): React_2.ReactElement;

export declare function AutocompleteLabel({ className, ...props }: Autocomplete_2.GroupLabel.Props): React_2.ReactElement;

export declare function AutocompleteList({ className, ...props }: Autocomplete_2.List.Props): React_2.ReactElement;

export declare function AutocompleteSeparator({ className, ...props }: Autocomplete_2.Separator.Props): React_2.ReactElement;

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
export declare function AutocompleteStatus({ className, children, emptyContent, ...props }: Omit<Autocomplete_2.Status.Props, 'children'> & {
    /**
     * Override the default "{count} results" rendering. Pass a function to
     * receive the count; pass a node to render statically.
     */
    children?: React_2.ReactNode | ((count: number) => React_2.ReactNode);
    /** Rendered when the filtered count is zero. */
    emptyContent?: React_2.ReactNode;
}): React_2.ReactElement;

export declare const AutocompleteTrigger: React_2.ForwardRefExoticComponent<Omit<AutocompleteTriggerProps, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

export declare function AutocompleteValue({ ...props }: Autocomplete_2.Value.Props): React_2.ReactElement;

export declare const Avatar: React_2.ForwardRefExoticComponent<Omit<Omit<AvatarRootProps, "ref"> & React_2.RefAttributes<HTMLSpanElement> & {
    size?: AvatarSize;
}, "ref"> & React_2.RefAttributes<HTMLSpanElement>>;

export declare const AvatarFallback: React_2.ForwardRefExoticComponent<Omit<Omit<AvatarFallbackProps, "ref"> & React_2.RefAttributes<HTMLSpanElement>, "ref"> & React_2.RefAttributes<HTMLSpanElement>>;

export declare function AvatarGroup({ className, stacked, reverse, size, children, style, ...props }: React_2.ComponentProps<'div'> & {
    stacked?: boolean;
    reverse?: boolean;
    size?: AvatarSize;
}): React_2.ReactElement;

export declare const AvatarImage: React_2.ForwardRefExoticComponent<Omit<Omit<AvatarImageProps, "ref"> & React_2.RefAttributes<HTMLImageElement>, "ref"> & React_2.RefAttributes<HTMLImageElement>>;

declare type AvatarSize = 'lg' | 'default' | 'sm' | 'xs';

export declare function Badge({ className, variant, render, ...props }: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>): React_2.ReactElement;

export declare const badgeVariants: (props?: ({
    variant?: "default" | "destructive" | "info" | "warning" | "success" | "completed" | null | undefined;
} & ClassProp) | undefined) => string;

export declare const bubbleVariants: (props?: ({
    variant?: "default" | "outline" | "destructive" | "secondary" | "muted" | "tinted" | "ghost" | null | undefined;
} & ClassProp) | undefined) => string;

export declare const Button: React_2.ForwardRefExoticComponent<Omit<ButtonProps, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

export declare function ButtonGroup({ className, orientation, ...props }: React_2.ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>): React_2.ReactElement;

export declare function ButtonGroupSeparator({ className, orientation, ...props }: React_2.ComponentProps<typeof Separator>): React_2.ReactElement;

export declare function ButtonGroupText({ className, render, ...props }: useRender.ComponentProps<'div'>): React_2.ReactElement;

export declare const buttonGroupVariants: (props?: ({
    orientation?: "horizontal" | "vertical" | null | undefined;
} & ClassProp) | undefined) => string;

export declare type ButtonProps = Button_2.Props & VariantProps<typeof buttonVariants> & {
    /** Hides the label under a centered spinner and disables the button. Width stays stable. */
    loading?: boolean;
};

export declare const buttonVariants: (props?: ({
    variant?: "link" | "default" | "primary" | "outline" | "destructive" | "link-muted" | null | undefined;
    size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | null | undefined;
    focusableWhenDisabled?: boolean | null | undefined;
    left?: boolean | null | undefined;
    inert?: boolean | null | undefined;
} & ClassProp) | undefined) => string;

export declare function Card({ className, size, flush, ...props }: React_2.ComponentProps<'div'> & {
    size?: 'default' | 'sm';
    flush?: boolean;
}): React_2.ReactElement;

export declare function CardContent({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function CardDescription({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function CardFooter({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function CardGroup({ className, size, ...props }: React_2.ComponentProps<'div'> & {
    size?: 'default' | 'sm';
}): React_2.ReactElement;

export declare function CardHeader({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare const CardTitle: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React_2.RefAttributes<HTMLDivElement>>;

declare type CellLayout = {
    align?: Align;
    valign?: VAlign;
    /** Absorb remaining width in a `fullWidth` table. Mark one column per table. */
    expand?: boolean;
};

export declare function ChatBubble({ variant, align, className, ...props }: React_2.ComponentProps<'div'> & VariantProps<typeof bubbleVariants> & {
    align?: 'start' | 'end';
}): React_2.ReactElement;

export declare function ChatBubbleContent({ className, render, ...props }: useRender.ComponentProps<'div'>): React_2.ReactElement;

/**
 * Bubble surface primitives, vendored from the shadcn `base-mira` registry and renamed `ChatX`.
 * Scoped to the bubble surface only — avatar/name/timestamps/actions live on {@link ./chat-message}.
 *
 * Styling lives in `chat-bubble.css` (quill convention). Variants are intentionally generic;
 * restyle per product. Assistant turns use `variant="ghost"` (transparent, full-width); user turns
 * use a filled variant.
 */
export declare function ChatBubbleGroup({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function ChatBubbleReactions({ side, align, className, ...props }: React_2.ComponentProps<'div'> & {
    align?: 'start' | 'end';
    side?: 'top' | 'bottom';
}): React_2.ReactElement;

export declare function ChatGlobe({ className, ...props }: React_2.ComponentProps<'svg'>): React_2.ReactElement;

export declare function ChatMarker({ body, ...props }: ChatMarkerProps): React_2.ReactElement;

export declare function ChatMarkerContent({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

export declare function ChatMarkerIcon({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

declare type ChatMarkerProps = useRender.ComponentProps<'div'> & VariantProps<typeof markerVariants> & {
    /**
     * Omit for a settled note. `running` shimmers the content, `error` turns the row destructive,
     * `done` keeps the value it acted on. The app flips it; the primitive never infers it.
     */
    status?: ChatMarkerStatus;
    /** Renders the marker as a collapsible: this becomes the expandable panel below the row. */
    body?: React_2.ReactNode;
    /** Uncontrolled initial open state (only meaningful with `body`). */
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

/**
 * Everything an agent did, at every fill level — vendored from the shadcn `base-mira` registry and
 * renamed `ChatX`. Styling lives in `chat-marker.css` (quill convention).
 *
 * The fill levels are one primitive, not three. Resist splitting them back apart:
 *
 * - A **note** is the flat row: icon + text, nothing to open.
 * - A **tool call** adds `status` — it shimmers while `running` and goes destructive on `error` —
 *   and usually a `ChatMarkerValue` for the argument it acted on.
 * - A **group** passes `body` and drops the icon: the row becomes the joined-up summary ("Read 2
 *   files · Edited 1 file") and the calls behind it are markers of their own inside. No single icon
 *   is honest about several tools at once, which is why the icon is a slot you fill, not a fixture.
 *
 * Quill divergence from stock shadcn Marker: pass `body` to make it collapsible. The row becomes a
 * Base-UI Collapsible trigger (hover reveals a chevron + `bg-fill-hover`, click toggles, the body
 * renders below). Collapse state is uncontrolled via `defaultOpen`; `open`/`onOpenChange` are there
 * for the rare case the app drives it (e.g. auto-expand the running tool).
 *
 * Fill the body with more markers, or with `ChatSourceList` when the tool returned pages.
 */
export declare type ChatMarkerStatus = 'running' | 'done' | 'error';

/** The argument a call acted on — a query, a path, a command. Quoted, and kept once it settles. */
export declare function ChatMarkerValue({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

export declare function ChatMessage({ className, align, ...props }: React_2.ComponentProps<'div'> & {
    align?: 'start' | 'end';
}): React_2.ReactElement;

export declare function ChatMessageAvatar({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function ChatMessageContent({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function ChatMessageFooter({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

/**
 * Message row primitives, vendored from the shadcn `base-mira` registry and renamed `ChatX`.
 * Styling lives in `chat-message.css` (quill convention); `data-slot`/`data-align` attributes drive
 * the selectors. Avatar is optional.
 *
 * Anatomy:  ChatMessage > [ChatMessageAvatar] + ChatMessageContent > [Header] + Bubble + [Footer]
 */
export declare function ChatMessageGroup({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function ChatMessageHeader({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function ChatMessageScroller({ className, ...props }: React_2.ComponentProps<typeof MessageScroller.Root>): React_2.ReactElement;

/**
 * Scroll-to-edge control. The engine toggles `data-active` from imperative scroll tracking;
 * visibility/animation is pure CSS off that attribute.
 */
export declare function ChatMessageScrollerButton({ direction, className, children, render, ...props }: React_2.ComponentProps<typeof MessageScroller.Button>): React_2.ReactElement;

export declare function ChatMessageScrollerContent({ className, density, ...props }: ChatMessageScrollerContentProps): React_2.ReactElement;

declare type ChatMessageScrollerContentProps = React_2.ComponentProps<typeof MessageScroller.Content> & {
    /** Row spacing: `dense` 0.5rem, `default` 1rem, `loose` 1.5rem. */
    density?: 'dense' | 'default' | 'loose';
};

/**
 * One transcript row. `scrollAnchor` marks turn boundaries (the engine pins anchored rows near the
 * viewport top on new turns). Off-screen size estimate is tuned in `chat-message-scroller.css`.
 */
export declare function ChatMessageScrollerItem({ className, scrollAnchor, ...props }: React_2.ComponentProps<typeof MessageScroller.Item>): React_2.ReactElement;

/**
 * Thin quill wrapper over the headless `@shadcn/react/message-scroller` engine.
 *
 * Non-virtualized by design: rows stay in the DOM, kept cheap via `content-visibility: auto` +
 * `contain-intrinsic-size` (see {@link ChatMessageScrollerItem}). Stick-to-bottom, anchoring, and
 * preserve-on-prepend are imperative inside the engine and surfaced through `data-*` attributes —
 * no React state on scroll. Styling lives in `chat-message-scroller.css` (quill convention).
 */
export declare function ChatMessageScrollerProvider(props: React_2.ComponentProps<typeof MessageScroller.Provider>): React_2.ReactElement;

export declare function ChatMessageScrollerViewport({ className, ...props }: React_2.ComponentProps<typeof MessageScroller.Viewport>): React_2.ReactElement;

export declare function ChatSource({ status, className, children, href, render, ...props }: ChatSourceProps): React_2.ReactElement;

export declare function ChatSourceList({ className, ...props }: React_2.ComponentProps<'ul'>): React_2.ReactElement;

declare type ChatSourceProps = useRender.ComponentProps<'a'> & {
    status?: ChatSourceStatus;
    href?: string;
};

/**
 * A page an agent found and read — the rows a web search discloses. Vendored from the aicss
 * web-search pattern and renamed `ChatSource`. Drop a `ChatSourceList` into a `ChatMarker`'s `body`.
 *
 * `status` walks a row through the fetch: `pending` (found, not opened) shows a dashed ring,
 * `loading` swaps in a sweeping {@link ./chat-globe#ChatGlobe}, `done` lands on a check. The app owns
 * when each row moves — same contract as the rest of the family, since only the app knows what the
 * agent is actually doing.
 *
 * Give a row an `href` and it becomes a link with an out-arrow; without one it's static text.
 */
export declare type ChatSourceStatus = 'pending' | 'loading' | 'done';

export declare function ChatSourceTitle({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

export declare function ChatSourceUrl({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

export declare function ChatStream({ pinned, className, children, onScroll, ...props }: ChatStreamProps): React_2.ReactElement;

/** One line of output. Reveals itself as it arrives, while the stream is pinned. */
export declare function ChatStreamLine({ className, ...props }: React_2.ComponentProps<'p'>): React_2.ReactElement;

/**
 * Output arriving live, in a window that follows it — an agent thinking out loud, a log tailing, a
 * response streaming in.
 *
 * `pinned` is the whole API. While it's true the window stays anchored to the newest content: the
 * stream slides up as it outgrows the cap, older lines dissolve off the top edge, and the reader
 * can't scroll (there's nothing below to scroll to). Turn it off when the output stops and the
 * window becomes an ordinary scroll area, left exactly where the pin ended — on the last thing
 * said — for the reader to scroll back through.
 *
 * The pin is a transform, not a scroll. A scroll jump teleports the older lines; a transform can
 * ease, and it doesn't affect layout — so the window still sizes to its content, capped by
 * `--quill-chat-stream-max-height` (default `11.25rem`).
 *
 * It brings no chrome and no rail: drop it wherever the output belongs — a `ThreadItemBody` in a
 * feed, a `ChatMarker`'s `body` behind a "Thinking…" summary — and let the container frame it.
 */
declare type ChatStreamProps = React_2.ComponentProps<'div'> & {
    /** Follow the newest content. Turn it off when the output stops and the reader takes over. */
    pinned?: boolean;
};

export declare function ChatTask({ status, truncate, className, children, ...props }: ChatTaskProps): React_2.ReactElement;

/** What the step produced: a duration, an exit code, the line that explains a failure. */
export declare function ChatTaskDetail({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

export declare function ChatTaskList({ value, total, className, ...props }: ChatTaskListProps): React_2.ReactElement;

export declare function ChatTaskListContent({ className, children, ...props }: React_2.ComponentProps<'ol'>): React_2.ReactElement;

/**
 * `2/5`, where each digit rolls to its successor. The rolling glyphs are decorative — the real value
 * goes to screen readers once, as text, instead of announcing a half-rolled pair.
 */
export declare function ChatTaskListCount({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

export declare function ChatTaskListLabel({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

/**
 * The header's at-a-glance state: a list before anything starts, a ring that fills as steps land, a
 * check once they all have. Derived from `value`/`total`, so it can't drift from the count beside it.
 *
 * It doubles as the disclosure affordance: hovering or focusing the row swaps the state icon for a
 * chevron, the same trade `CollapsibleTrigger`'s `icon` prop makes. The state is what you want at
 * rest; the chevron only matters once you've reached for it, so it doesn't need to sit there
 * permanently taking up the row.
 */
export declare function ChatTaskListProgress({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

declare type ChatTaskListProps = React_2.ComponentProps<typeof Collapsible_2.Root> & {
    /** Steps finished so far. Drives the header icon and the count; never inferred from children. */
    value: number;
    /** Steps in the plan. */
    total: number;
};

export declare function ChatTaskListTrigger({ className, children, ...props }: React_2.ComponentProps<typeof Collapsible_2.Trigger>): React_2.ReactElement;

declare type ChatTaskProps = React_2.ComponentProps<'li'> & {
    status?: ChatTaskStatus;
    /** Clamp the label to one line with an ellipsis. Off by default — a long step wraps. */
    truncate?: boolean;
};

/**
 * The plan an agent is working through — a checklist that fills in as steps land. Adapted from the
 * aicss to-do list pattern. Sibling of {@link ./chat-marker#ChatMarker}, which covers what the agent
 * *did* — a note, a call, a group of them. This is the *plan*: many steps, an aggregate count, and
 * each step carrying its own outcome.
 *
 * The list holds no state. `value`/`total` are the app's count of finished steps, and every `ChatTask`
 * carries its own `status` — nothing is inferred from the children, because only the app knows which
 * step is running or why one broke.
 *
 * It's the same primitive whether the steps are to-dos or a sandbox booting; only the copy and the
 * statuses differ. There's no `variant` — a checklist is a checklist.
 *
 * Steps wrap by default; pass `truncate` to a `ChatTask` to clamp it to one line instead.
 */
export declare type ChatTaskStatus = 'pending' | 'active' | 'done' | 'failed';

export declare function Checkbox({ className, size, ...props }: Checkbox_2.Root.Props & VariantProps<typeof checkboxVariants>): React_2.ReactElement;

export declare function CheckboxIndicator({ checked, className, size, }: {
    checked?: boolean;
    className?: string;
} & VariantProps<typeof checkboxIndicatorVariants>): React_2.ReactElement;

declare const checkboxIndicatorVariants: (props?: ({
    size?: "default" | "sm" | null | undefined;
} & ClassProp) | undefined) => string;

declare const checkboxVariants: (props?: ({
    size?: "default" | "sm" | null | undefined;
} & ClassProp) | undefined) => string;

export declare const Chip: React_2.ForwardRefExoticComponent<Omit<ChipProps, "ref"> & React_2.RefAttributes<HTMLDivElement>>;

export declare const ChipClose: React_2.ForwardRefExoticComponent<Omit<Omit<ButtonProps, "ref"> & React_2.RefAttributes<HTMLButtonElement>, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

export declare function ChipGroup({ className, ...props }: React_2.ComponentProps<typeof ButtonGroup> & VariantProps<typeof buttonGroupVariants>): React_2.ReactElement;

declare type ChipProps = Omit<React_2.ComponentProps<typeof Button>, 'variant'> & Omit<VariantProps<typeof buttonVariants>, 'variant'>;

export declare function cn(...inputs: ClassValue[]): string;

export declare function Collapsible({ variant, className, ...props }: CollapsibleProps): React_2.ReactElement;

export declare function CollapsibleContent({ children, className, ...props }: Collapsible_2.Panel.Props): React_2.ReactElement;

/**
 * Row container for the icon-only trigger pattern: the trigger toggles, while
 * siblings (a link, trailing count, actions) stay independently interactive.
 * Use `ms-auto` on trailing content so it stays end-aligned in RTL.
 */
export declare function CollapsibleHeader({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

declare type CollapsibleProps = Collapsible_2.Root.Props & {
    variant?: CollapsibleVariant;
};

export declare function CollapsibleTrigger({ children, className, iconOnly, icon, ...props }: Collapsible_2.Trigger.Props & {
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
    icon?: React_2.ReactNode;
}): React_2.ReactElement;

declare type CollapsibleVariant = 'default' | 'folder';

export declare function Combobox<Value, Multiple extends boolean | undefined = false>({ children, ...props }: Combobox_2.Root.Props<Value, Multiple>): React_2.ReactElement;

export declare function ComboboxChip({ className, children, title, showRemove, ...props }: Combobox_2.Chip.Props & {
    showRemove?: boolean;
    title?: string;
}): React_2.ReactElement;

export declare function ComboboxChips({ className, ...props }: React_2.ComponentPropsWithRef<typeof Combobox_2.Chips> & Combobox_2.Chips.Props): React_2.ReactElement;

export declare function ComboboxChipsInput({ className, ...props }: Combobox_2.Input.Props): React_2.ReactElement;

export declare function ComboboxCollection({ ...props }: Combobox_2.Collection.Props): React_2.ReactElement;

export declare function ComboboxContent({ className, side, sideOffset, align, alignOffset, anchor: anchorProp, ...props }: Combobox_2.Popup.Props & Pick<Combobox_2.Positioner.Props, 'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor'>): React_2.ReactElement;

export declare function ComboboxEmpty({ className, children, ...props }: Combobox_2.Empty.Props): React_2.ReactElement;

export declare function ComboboxGroup({ className, ...props }: Combobox_2.Group.Props): React_2.ReactElement;

export declare function ComboboxInput({ className, children, disabled, showTrigger, showClear, ...props }: Combobox_2.Input.Props & {
    showTrigger?: boolean;
    showClear?: boolean;
}): React_2.ReactElement;

export declare function ComboboxItem({ className, children, title, ...props }: Combobox_2.Item.Props & {
    title?: string;
}): React_2.ReactElement;

export declare function ComboboxLabel({ className, ...props }: Combobox_2.GroupLabel.Props): React_2.ReactElement;

export declare function ComboboxList({ className, ...props }: Combobox_2.List.Props): React_2.ReactElement;

export declare function ComboboxListFooter({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function ComboboxSeparator({ className, ...props }: Combobox_2.Separator.Props): React_2.ReactElement;

export declare const ComboboxTrigger: React_2.ForwardRefExoticComponent<Omit<ComboboxTriggerProps, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

export declare function ComboboxValue({ ...props }: Combobox_2.Value.Props): React_2.ReactElement;

export declare function ContextMenu({ ...props }: ContextMenu_2.Root.Props): React_2.ReactElement;

export declare function ContextMenuCheckboxItem({ className, children, checked, inset, ...props }: ContextMenu_2.CheckboxItem.Props & {
    inset?: boolean;
}): React_2.ReactElement;

export declare function ContextMenuContent({ className, align, alignOffset, side, sideOffset, children, ...props }: ContextMenu_2.Popup.Props & Pick<ContextMenu_2.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>): React_2.ReactElement;

export declare function ContextMenuGroup({ ...props }: ContextMenu_2.Group.Props): React_2.ReactElement;

export declare function ContextMenuItem({ className, inset, variant, children, ...props }: ContextMenu_2.Item.Props & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
}): React_2.ReactElement;

export declare function ContextMenuLabel({ className, inset, ...props }: ContextMenu_2.GroupLabel.Props & {
    inset?: boolean;
}): React_2.ReactElement;

export declare function ContextMenuPortal({ ...props }: ContextMenu_2.Portal.Props): React_2.ReactElement;

export declare function ContextMenuRadioGroup({ ...props }: ContextMenu_2.RadioGroup.Props): React_2.ReactElement;

export declare function ContextMenuRadioItem({ className, children, inset, ...props }: ContextMenu_2.RadioItem.Props & {
    inset?: boolean;
}): React_2.ReactElement;

export declare function ContextMenuSeparator({ className, ...props }: ContextMenu_2.Separator.Props): React_2.ReactElement;

export declare function ContextMenuShortcut({ className, ...props }: React_2.ComponentProps<typeof Kbd>): React_2.ReactElement;

export declare function ContextMenuSub({ ...props }: ContextMenu_2.SubmenuRoot.Props): React_2.ReactElement;

export declare function ContextMenuSubContent({ className, align, alignOffset, side, sideOffset, ...props }: React_2.ComponentProps<typeof ContextMenuContent>): React_2.ReactElement;

export declare function ContextMenuSubTrigger({ className, inset, children, ...props }: ContextMenu_2.SubmenuTrigger.Props & {
    inset?: boolean;
}): React_2.ReactElement;

export declare function ContextMenuTrigger({ className, ...props }: ContextMenu_2.Trigger.Props): React_2.ReactElement;

export declare const CUSTOM_RANGE: DateTimeRange;

/**
 * Headless TanStack Table wired onto the quill Table primitive — client-side
 * sorting out of the box (sortable columns render a sort button + indicator and
 * set `aria-sort`), selection reflected via the row's `data-state`, optional
 * pagination, and an empty state. Pass `enableSorting: false` on a column to opt
 * it out, `meta: { align }` to align a column's header and cells, or
 * `fullWidth` + `meta: { expand: true }` to stretch one column to fill.
 */
export declare function DataTable<TData, TValue>({ columns, data, className, stickyHeader, fullWidth, size, empty, pageSize, pageSizeOptions, }: DataTableProps<TData, TValue>): React_2.ReactElement;

export declare interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    /** Sizing/scroll classes for the table container (forwarded to the Table primitive). */
    className?: string;
    /** Sticky header mode, forwarded to the Table primitive. `'page'` sticks to document scroll. */
    stickyHeader?: boolean | 'page';
    /**
     * Stretch the table to fill its container (forwarded to the Table primitive).
     * Mark a column with `meta: { expand: true }` to choose which one absorbs the
     * slack.
     */
    fullWidth?: boolean;
    /**
     * Cell density, forwarded to the Table primitive. `'sm'` tightens head/cell
     * inline padding to `0.75rem` — pair with a `Card size="sm"` so edge columns
     * align with the card's inline padding.
     */
    size?: 'default' | 'sm';
    /**
     * Rendered in place of rows when `data` is empty. Defaults to a minimal
     * "No results" Empty; pass a richer node (custom copy, actions) to override.
     */
    empty?: React_2.ReactNode;
    /**
     * Enables client-side pagination at this page size and renders a pager below
     * the table. Omit for a single, un-paginated list.
     */
    pageSize?: number;
    /**
     * Page-size choices shown in a selector beside the pager. Only rendered when
     * `pageSize` is set; omit to hide the selector and keep a fixed page size.
     */
    pageSizeOptions?: number[];
}

export declare type DateFormatOrder = 'MDY' | 'DMY' | 'YMD';

export declare function DatePicker({ value, onApply, onCancel, minDate, maxDate: maxDateProp, dateFormat, weekStartsOn, onDateTimeSettings, showTime, showTimeToggle, onIncludeTimeChange, className, }: DatePickerProps): React_2.ReactElement;

export declare interface DatePickerProps {
    value: Date;
    onApply: (value: Date) => void;
    onCancel?: () => void;
    minDate?: Date;
    maxDate?: Date;
    dateFormat?: DateFormatOrder;
    weekStartsOn?: Day;
    onDateTimeSettings?: () => void;
    /** Include time in the value initially. When off, the value is floored to the start of the day. */
    showTime?: boolean;
    /** Render the "Include time" toggle so the user can switch time on and off. Defaults to `showTime`. Set false for a fixed precision. */
    showTimeToggle?: boolean;
    /** Fired when the "Include time" toggle changes. */
    onIncludeTimeChange?: (includeTime: boolean) => void;
    className?: string;
}

export declare function DateTimePicker({ value, onApply, onCancel, minDate, maxDate: maxDateProp, dateFormat, weekStartsOn, onDateTimeSettings, compact, ranges, showHeader, showTime, className, }: DateTimePickerProps): React_2.ReactElement;

export declare interface DateTimePickerProps {
    value: DateTimeValue;
    onApply: (value: DateTimeValue) => void;
    onCancel?: () => void;
    minDate?: Date;
    maxDate?: Date;
    dateFormat?: DateFormatOrder;
    weekStartsOn?: Day;
    onDateTimeSettings?: () => void;
    compact?: boolean;
    /** Quick-range presets to offer. Defaults to `quickRanges`; `CUSTOM_RANGE` entries are filtered out. */
    ranges?: DateTimeRange[];
    /** Hide the "Choose date range / Quick ranges" header band when embedding in a host surface. */
    showHeader?: boolean;
    /** Day-granular mode: hides the time segments and "Now", and drops time from the footer readout. */
    showTime?: boolean;
    className?: string;
}

export declare interface DateTimeRange {
    id: number;
    name: DateTimeRangeName;
    /** Returns the range's start for a given "now". */
    rangeSetter: (date: Date) => Date;
    /** Returns the range's end for a given "now". Defaults to "now" itself. */
    endSetter?: (date: Date) => Date;
}

export declare type DateTimeRangeName = string;

export declare interface DateTimeValue {
    start: Date;
    end: Date;
    range: DateTimeRange;
}

export declare const Day: {
    readonly SUNDAY: 0;
    readonly MONDAY: 1;
    readonly TUESDAY: 2;
    readonly WEDNESDAY: 3;
    readonly THURSDAY: 4;
    readonly FRIDAY: 5;
    readonly SATURDAY: 6;
};

export declare type Day = (typeof Day)[keyof typeof Day];

/** Note: if you're nesting dialogs, in order for you to click the overlay to close it, you must pass 'mounted: true' to the nested dialog*/
export declare function Dialog({ ...props }: Dialog_2.Root.Props): React_2.ReactElement;

export declare function DialogBody({ className, render, children, viewportClassName, ...props }: useRender.ComponentProps<'div'> & {
    /**
     * Class applied to the inner ScrollArea viewport (`data-slot="scroll-area-viewport"`),
     * the element that actually scrolls. For example, `viewportClassName="p-0"` drops the
     * default body padding for full-bleed content. Ignored when a custom `render` is
     * supplied (set `viewportClassName` on your own `<ScrollArea>` there instead).
     */
    viewportClassName?: string;
}): React_2.ReactElement;

export declare function DialogClose({ ...props }: Dialog_2.Close.Props): React_2.ReactElement;

export declare function DialogContent({ className, children, showCloseButton, nested, size, ...props }: Dialog_2.Popup.Props & {
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
}): React_2.ReactElement;

export declare function DialogDescription({ className, ...props }: Dialog_2.Description.Props): React_2.ReactElement;

export declare function DialogFooter({ className, showCloseButton, children, ...props }: React_2.ComponentProps<'div'> & {
    showCloseButton?: boolean;
}): React_2.ReactElement;

export declare function DialogHeader({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function DialogOverlay({ className, ...props }: Dialog_2.Backdrop.Props): React_2.ReactElement;

export declare function DialogPortal({ ...props }: Dialog_2.Portal.Props): React_2.ReactElement;

export declare function DialogTitle({ className, ...props }: Dialog_2.Title.Props): React_2.ReactElement;

export declare function DialogTrigger({ ...props }: Dialog_2.Trigger.Props): React_2.ReactElement;

export { DirectionProvider }

export declare function Dot({ className, variant, pulse, ...props }: React_2.ComponentProps<'span'> & VariantProps<typeof dotVariants>): React_2.ReactElement;

export declare const dotVariants: (props?: ({
    variant?: "default" | "destructive" | "info" | "warning" | "success" | null | undefined;
    pulse?: boolean | null | undefined;
} & ClassProp) | undefined) => string;

export declare function Drawer({ ...props }: Drawer_2.Root.Props): React_2.ReactElement;

export declare function DrawerBackdrop({ className, ...props }: Drawer_2.Backdrop.Props): React_2.ReactElement;

export declare function DrawerClose({ ...props }: Drawer_2.Close.Props): React_2.ReactElement;

export declare function DrawerContent({ className, children, ...props }: Drawer_2.Popup.Props): React_2.ReactElement;

export declare function DrawerDescription({ className, ...props }: Drawer_2.Description.Props): React_2.ReactElement;

export declare function DrawerFooter({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function DrawerHandle({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function DrawerHeader({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function DrawerPortal({ ...props }: Drawer_2.Portal.Props): React_2.ReactElement;

export declare function DrawerTitle({ className, ...props }: Drawer_2.Title.Props): React_2.ReactElement;

export declare function DrawerTrigger({ ...props }: Drawer_2.Trigger.Props): React_2.ReactElement;

export declare function DropdownMenu({ ...props }: Menu.Root.Props): React_2.ReactElement;

export declare function DropdownMenuCheckboxItem({ className, children, checked, inset, ...props }: Menu.CheckboxItem.Props & {
    inset?: boolean;
}): React_2.ReactElement;

export declare function DropdownMenuContent({ align, alignOffset, side, sideOffset, className, anchor, children, ...props }: Menu.Popup.Props & Pick<Menu.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'anchor'>): React_2.ReactElement;

export declare function DropdownMenuGroup({ ...props }: Menu.Group.Props): React_2.ReactElement;

export declare function DropdownMenuItem({ className, inset, variant, ...props }: Menu.Item.Props & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
}): React_2.ReactElement;

export declare function DropdownMenuLabel({ className, inset, ...props }: Menu.GroupLabel.Props & {
    inset?: boolean;
}): React_2.ReactElement;

export declare function DropdownMenuPortal({ ...props }: Menu.Portal.Props): React_2.ReactElement;

export declare function DropdownMenuRadioGroup({ ...props }: Menu.RadioGroup.Props): React_2.ReactElement;

export declare function DropdownMenuRadioItem({ className, children, inset, ...props }: Menu.RadioItem.Props & {
    inset?: boolean;
}): React_2.ReactElement;

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
export declare function DropdownMenuSelectAll<T>({ values, selected, onChange, getKey, selectLabel, deselectLabel, children, ...itemProps }: {
    values: readonly T[];
    selected: readonly T[];
    onChange: (next: T[]) => void;
    getKey?: (value: T) => string | number;
    selectLabel?: React_2.ReactNode;
    deselectLabel?: React_2.ReactNode;
    children?: (result: UseSelectAllResult) => React_2.ReactNode;
} & Omit<React_2.ComponentProps<typeof DropdownMenuItem>, 'children' | 'onClick' | 'onChange' | 'closeOnClick' | 'data-state'>): React_2.ReactElement;

export declare function DropdownMenuSeparator({ className, ...props }: Menu.Separator.Props): React_2.ReactElement;

export declare function DropdownMenuShortcut({ className, ...props }: React_2.ComponentProps<typeof Kbd>): React_2.ReactElement;

export declare function DropdownMenuSub({ ...props }: Menu.SubmenuRoot.Props): React_2.ReactElement;

export declare function DropdownMenuSubContent({ align, alignOffset, side, sideOffset, className, ...props }: React_2.ComponentProps<typeof DropdownMenuContent>): React_2.ReactElement;

export declare function DropdownMenuSubTrigger({ className, inset, children, ...props }: Menu.SubmenuTrigger.Props & {
    inset?: boolean;
}): React_2.ReactElement;

export declare function DropdownMenuTrigger({ ...props }: Menu.Trigger.Props): React_2.ReactElement;

export declare function Empty({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function EmptyContent({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function EmptyDescription({ className, ...props }: React_2.ComponentProps<'p'>): React_2.ReactElement;

export declare function EmptyHeader({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function EmptyMedia({ className, variant, ...props }: React_2.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>): React_2.ReactElement;

declare const emptyMediaVariants: (props?: ({
    variant?: "default" | "icon" | null | undefined;
} & ClassProp) | undefined) => string;

export declare function EmptyTitle({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function Field({ className, orientation, ...props }: React_2.ComponentProps<'div'> & VariantProps<typeof fieldVariants>): React_2.ReactElement;

export declare function FieldContent({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function FieldDescription({ className, ...props }: React_2.ComponentProps<'p'>): React_2.ReactElement;

export declare function FieldError({ className, children, errors, ...props }: React_2.ComponentProps<'div'> & {
    errors?: Array<{
        message?: string;
    } | undefined>;
}): React_2.ReactElement | null;

export declare function FieldGroup({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function FieldLabel({ className, ...props }: React_2.ComponentProps<typeof Label>): React_2.ReactElement;

export declare function FieldLegend({ className, variant, ...props }: React_2.ComponentProps<'legend'> & {
    variant?: 'legend' | 'label';
}): React_2.ReactElement;

export declare function FieldSeparator({ children, className, ...props }: React_2.ComponentProps<'div'> & {
    children?: React_2.ReactNode;
}): React_2.ReactElement;

export declare function FieldSet({ className, ...props }: React_2.ComponentProps<'fieldset'>): React_2.ReactElement;

export declare function FieldTitle({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

declare const fieldVariants: (props?: ({
    orientation?: "horizontal" | "vertical" | "responsive" | null | undefined;
} & ClassProp) | undefined) => string;

export declare function getPaginationRange(pageCount: number, pageIndex: number, siblingCount?: number): PaginationRangeItem[];

export declare function Heading({ className, size, render, ...props }: useRender.ComponentProps<'h2'> & VariantProps<typeof headingVariants>): React_2.ReactElement;

export declare const headingVariants: (props?: ({
    size?: "base" | "sm" | "lg" | "2xl" | "xl" | null | undefined;
} & ClassProp) | undefined) => string;

export declare const Input: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "ref"> & React_2.RefAttributes<HTMLInputElement>>;

export declare const InputGroup: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React_2.RefAttributes<HTMLDivElement>>;

export declare function InputGroupAddon({ className, align, ...props }: React_2.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>): React_2.ReactElement;

declare const inputGroupAddonVariants: (props?: ({
    align?: "inline-start" | "inline-end" | "block-start" | "block-end" | null | undefined;
} & ClassProp) | undefined) => string;

export declare const InputGroupButton: React_2.ForwardRefExoticComponent<Omit<Omit<Omit<ButtonProps, "ref"> & React_2.RefAttributes<HTMLButtonElement>, "size" | "type"> & VariantProps<(props?: ({
    size?: "xs" | "sm" | "icon-xs" | "icon-sm" | null | undefined;
} & ClassProp) | undefined) => string> & {
    type?: "button" | "submit" | "reset";
}, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

export declare const InputGroupInput: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "ref"> & React_2.RefAttributes<HTMLInputElement>>;

export declare function InputGroupNumberInput({ className, inputRef, ...rootProps }: InputGroupNumberInputProps): React_2.ReactElement;

declare interface InputGroupNumberInputProps extends Omit<NumberField.Root.Props, 'className' | 'children'> {
    className?: string;
    inputRef?: React_2.Ref<HTMLInputElement>;
}

export declare function InputGroupText({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

export declare function InputGroupTextarea({ className, ...props }: React_2.ComponentProps<'textarea'>): React_2.ReactElement;

export declare function Item({ className, variant, size, tone, role, render, ...props }: useRender.ComponentProps<'div'> & VariantProps<typeof itemVariants>): React_2.ReactElement;

export declare function ItemActions({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare const ItemCheckbox: React_2.ForwardRefExoticComponent<Omit<Omit<React_2.DetailedHTMLProps<React_2.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "ref"> & {
    ref?: ((instance: HTMLButtonElement | null) => void | React_2.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof React_2.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES]) | React_2.RefObject<HTMLButtonElement> | null | undefined;
} & {
    render?: React_2.ReactElement<any, string | React_2.JSXElementConstructor<any>> | ComponentRenderFn<HTMLProps, {}> | undefined;
} & VariantProps<(props?: ({
    variant?: "default" | "outline" | "muted" | "pressable" | "menuItem" | null | undefined;
    size?: "default" | "xs" | "sm" | null | undefined;
    tone?: "default" | "destructive" | "info" | "warning" | "success" | "completed" | null | undefined;
} & ClassProp) | undefined) => string>, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

export declare function ItemContent({ className, variant, ...props }: React_2.ComponentProps<'div'> & VariantProps<typeof itemContentVariants>): React_2.ReactElement;

declare const itemContentVariants: (props?: ({
    variant?: "default" | "menuItem" | null | undefined;
} & ClassProp) | undefined) => string;

export declare function ItemDescription({ className, ...props }: React_2.ComponentProps<'p'>): React_2.ReactElement;

export declare function ItemFooter({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function ItemGroup({ className, combined, ...props }: React_2.ComponentProps<'div'> & {
    combined?: boolean;
}): React_2.ReactElement;

export declare function ItemHeader({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function ItemMedia({ className, variant, ...props }: React_2.ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>): React_2.ReactElement;

declare const itemMediaVariants: (props?: ({
    variant?: "image" | "checkbox" | "default" | "icon" | null | undefined;
} & ClassProp) | undefined) => string;

export declare const ItemMenuItem: React_2.ForwardRefExoticComponent<Omit<Omit<React_2.DetailedHTMLProps<React_2.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "ref"> & {
    ref?: ((instance: HTMLButtonElement | null) => void | React_2.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof React_2.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES]) | React_2.RefObject<HTMLButtonElement> | null | undefined;
} & {
    render?: React_2.ReactElement<any, string | React_2.JSXElementConstructor<any>> | ComponentRenderFn<HTMLProps, {}> | undefined;
} & VariantProps<(props?: ({
    variant?: "default" | "outline" | "muted" | "pressable" | "menuItem" | null | undefined;
    size?: "default" | "xs" | "sm" | null | undefined;
    tone?: "default" | "destructive" | "info" | "warning" | "success" | "completed" | null | undefined;
} & ClassProp) | undefined) => string>, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

export declare const ItemRadio: React_2.ForwardRefExoticComponent<Omit<Omit<React_2.DetailedHTMLProps<React_2.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "ref"> & {
    ref?: ((instance: HTMLButtonElement | null) => void | React_2.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof React_2.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES]) | React_2.RefObject<HTMLButtonElement> | null | undefined;
} & {
    render?: React_2.ReactElement<any, string | React_2.JSXElementConstructor<any>> | ComponentRenderFn<HTMLProps, {}> | undefined;
} & VariantProps<(props?: ({
    variant?: "default" | "outline" | "muted" | "pressable" | "menuItem" | null | undefined;
    size?: "default" | "xs" | "sm" | null | undefined;
    tone?: "default" | "destructive" | "info" | "warning" | "success" | "completed" | null | undefined;
} & ClassProp) | undefined) => string>, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

export declare function ItemSeparator({ className, ...props }: React_2.ComponentProps<typeof Separator>): React_2.ReactElement;

export declare function ItemTitle({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

declare const itemVariants: (props?: ({
    variant?: "default" | "outline" | "muted" | "pressable" | "menuItem" | null | undefined;
    size?: "default" | "xs" | "sm" | null | undefined;
    tone?: "default" | "destructive" | "info" | "warning" | "success" | "completed" | null | undefined;
} & ClassProp) | undefined) => string;

export declare function Kbd({ className, ...props }: React_2.ComponentProps<'kbd'>): React_2.ReactElement;

export declare function KbdGroup({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function KbdText({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

export declare function Label({ className, ...props }: React_2.ComponentProps<'label'>): React_2.ReactElement;

export declare const markerVariants: (props?: ({
    variant?: "separator" | "default" | "border" | null | undefined;
} & ClassProp) | undefined) => string;

export declare function Menubar({ className, ...props }: Menubar_2.Props): React_2.ReactElement;

export declare function MenubarCheckboxItem({ className, children, checked, inset, ...props }: Menu.CheckboxItem.Props & {
    inset?: boolean;
}): React_2.ReactElement;

export declare function MenubarContent({ className, align, alignOffset, sideOffset, ...props }: React_2.ComponentProps<typeof DropdownMenuContent>): React_2.ReactElement;

export declare function MenubarGroup({ ...props }: React_2.ComponentProps<typeof DropdownMenuGroup>): React_2.ReactElement;

export declare function MenubarItem({ className, inset, variant, ...props }: React_2.ComponentProps<typeof DropdownMenuItem>): React_2.ReactElement;

export declare function MenubarLabel({ className, inset, ...props }: React_2.ComponentProps<typeof DropdownMenuLabel> & {
    inset?: boolean;
}): React_2.ReactElement;

export declare function MenubarMenu({ ...props }: React_2.ComponentProps<typeof DropdownMenu>): React_2.ReactElement;

export declare function MenubarPortal({ ...props }: React_2.ComponentProps<typeof DropdownMenuPortal>): React_2.ReactElement;

export declare function MenubarRadioGroup({ ...props }: React_2.ComponentProps<typeof DropdownMenuRadioGroup>): React_2.ReactElement;

export declare function MenubarRadioItem({ className, children, inset, ...props }: Menu.RadioItem.Props & {
    inset?: boolean;
}): React_2.ReactElement;

export declare function MenubarSeparator({ className, ...props }: React_2.ComponentProps<typeof DropdownMenuSeparator>): React_2.ReactElement;

export declare function MenubarShortcut({ className, ...props }: React_2.ComponentProps<typeof DropdownMenuShortcut>): React_2.ReactElement;

export declare function MenubarSub({ ...props }: React_2.ComponentProps<typeof DropdownMenuSub>): React_2.ReactElement;

export declare function MenubarSubContent({ className, ...props }: React_2.ComponentProps<typeof DropdownMenuSubContent>): React_2.ReactElement;

export declare function MenubarSubTrigger({ className, inset, ...props }: React_2.ComponentProps<typeof DropdownMenuSubTrigger> & {
    inset?: boolean;
}): React_2.ReactElement;

export declare function MenubarTrigger({ className, ...props }: React_2.ComponentProps<typeof DropdownMenuTrigger>): React_2.ReactElement;

export declare function MenuLabel({ className, render, ...props }: useRender.ComponentProps<'div'>): React_2.ReactElement;

export declare const Month: {
    readonly JANUARY: 0;
    readonly FEBRUARY: 1;
    readonly MARCH: 2;
    readonly APRIL: 3;
    readonly MAY: 4;
    readonly JUNE: 5;
    readonly JULY: 6;
    readonly AUGUST: 7;
    readonly SEPTEMBER: 8;
    readonly OCTOBER: 9;
    readonly NOVEMBER: 10;
    readonly DECEMBER: 11;
};

export declare type Month = (typeof Month)[keyof typeof Month];

export declare function NumberFieldDecrement({ className, children, ...props }: NumberField.Decrement.Props): React_2.ReactElement;

export declare function NumberFieldGroup({ className, ...props }: NumberField.Group.Props): React_2.ReactElement;

export declare function NumberFieldIncrement({ className, children, ...props }: NumberField.Increment.Props): React_2.ReactElement;

export declare const NumberFieldInput: React_2.ForwardRefExoticComponent<Omit<NumberFieldInputProps, "ref"> & React_2.RefAttributes<HTMLInputElement>>;

export declare function NumberFieldRoot({ className, ...props }: NumberField.Root.Props): React_2.ReactElement;

export declare function NumberFieldScrubArea({ className, ...props }: NumberField.ScrubArea.Props): React_2.ReactElement;

export declare function NumberFieldScrubAreaCursor({ className, ...props }: NumberField.ScrubAreaCursor.Props): React_2.ReactElement;

/**
 * Presentational pagination control — composable parts (no internal state). The
 * consumer owns page state and renders an item per page; wire `onClick`/`disabled`
 * on the buttons. Use {@link getPaginationRange} to build a first/last + sibling
 * window with ellipses for large page counts.
 */
export declare function Pagination({ className, ...props }: React_2.ComponentProps<'nav'>): React_2.ReactElement;

export declare namespace Pagination {
    var displayName: string;
}

export declare const PaginationButton: React_2.ForwardRefExoticComponent<Omit<PaginationButtonProps, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

declare type PaginationButtonProps = ButtonProps & {
    /** Marks the current page — sets `aria-current="page"` and the selected fill. */
    isActive?: boolean;
};

export declare const PaginationContent: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.HTMLAttributes<HTMLUListElement>, HTMLUListElement>, "ref"> & React_2.RefAttributes<HTMLUListElement>>;

export declare function PaginationEllipsis({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

export declare const PaginationItem: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>, "ref"> & React_2.RefAttributes<HTMLLIElement>>;

export declare const PaginationNext: React_2.ForwardRefExoticComponent<Omit<Omit<PaginationButtonProps, "isActive">, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

export declare const PaginationPrevious: React_2.ForwardRefExoticComponent<Omit<Omit<PaginationButtonProps, "isActive">, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

export declare type PaginationRangeItem = number | 'ellipsis';

export declare function Popover({ ...props }: Popover_2.Root.Props): React_2.ReactElement;

export declare function PopoverContent({ className, align, alignOffset, side, sideOffset, collisionAvoidance, container, ...props }: Popover_2.Popup.Props & Pick<Popover_2.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionAvoidance'> & Pick<Popover_2.Portal.Props, 'container'>): React_2.ReactElement;

export declare function PopoverTrigger({ ...props }: Popover_2.Trigger.Props): React_2.ReactElement;

export declare function Progress({ className, children, value, variant, ...props }: Progress_2.Root.Props & ProgressVariantProps): React_2.ReactElement;

export declare function ProgressIndicator({ className, variant, ...props }: Progress_2.Indicator.Props & ProgressVariantProps): React_2.ReactElement;

export declare const progressIndicatorVariants: (props?: ({
    variant?: "default" | "destructive" | "info" | "warning" | "success" | null | undefined;
} & ClassProp) | undefined) => string;

export declare function ProgressLabel({ className, ...props }: Progress_2.Label.Props): React_2.ReactElement;

export declare function ProgressTrack({ className, ...props }: Progress_2.Track.Props): React_2.ReactElement;

export declare function ProgressValue({ className, ...props }: Progress_2.Value.Props): React_2.ReactElement;

declare type ProgressVariantProps = VariantProps<typeof progressIndicatorVariants>;

export declare const quickRanges: DateTimeRange[];

export declare function RadioGroup({ className, ...props }: RadioGroup_2.Props): React_2.ReactElement;

export declare function RadioGroupItem({ className, size, ...props }: Radio.Root.Props & VariantProps<typeof radioGroupItemVariants>): React_2.ReactElement;

declare const radioGroupItemVariants: (props?: ({
    size?: "default" | "sm" | null | undefined;
} & ClassProp) | undefined) => string;

export declare function RadioIndicator({ checked, className, size, }: {
    checked?: boolean;
    className?: string;
} & VariantProps<typeof radioIndicatorVariants>): React_2.ReactElement;

declare const radioIndicatorVariants: (props?: ({
    size?: "default" | "sm" | null | undefined;
} & ClassProp) | undefined) => string;

export declare function ResizableHandle({ withHandle, className, ...props }: ResizablePrimitive.SeparatorProps & {
    withHandle?: boolean;
}): React_2.ReactElement;

export declare function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps): React_2.ReactElement;

export declare function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps): React_2.ReactElement;

export declare const SCROLL_SHADOWS_STYLE_ID = "quill-scroll-area-shadows";

export declare function ScrollArea({ className, children, scrollShadows, hideScrollbars, alwaysShowScrollbars, showScrollToButton, viewportClassName, ...props }: ScrollArea_2.Root.Props & {
    scrollShadows?: boolean;
    hideScrollbars?: boolean;
    alwaysShowScrollbars?: boolean;
    showScrollToButton?: ShowScrollToButton;
    viewportClassName?: string;
}): React_2.ReactElement;

export declare function ScrollBar({ className, orientation, alwaysVisible, ...props }: ScrollArea_2.Scrollbar.Props & {
    alwaysVisible?: boolean;
}): React_2.ReactElement;

declare type ScrollEdge = 'top' | 'right' | 'bottom' | 'left';

export declare const scrollShadowsCss = "\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"] {\n    --shadow-x-start: 0 0 0 0 transparent;\n    --shadow-x-end: 0 0 0 0 transparent;\n    --shadow-y-start: 0 0 0 0 transparent;\n    --shadow-y-end: 0 0 0 0 transparent;\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-start] {\n    --shadow-x-start: 16px 0 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-end] {\n    --shadow-x-end: -16px 0 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-start] {\n    --shadow-y-start: 0 16px 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-end] {\n    --shadow-y-end: 0 -16px 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::before,\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::after {\n    content: '';\n    position: absolute;\n    inset: 0;\n    pointer-events: none;\n    z-index: 2;\n    border-radius: inherit;\n    transition: box-shadow 200ms ease;\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::before {\n    box-shadow: var(--shadow-x-start) inset, var(--shadow-y-start) inset;\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::after {\n    box-shadow: var(--shadow-x-end) inset, var(--shadow-y-end) inset;\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-start] {\n    --shadow-x-start: 28px 0 24px -16px rgb(0 0 0 / 100%);\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-end] {\n    --shadow-x-end: -28px 0 24px -16px rgb(0 0 0 / 100%);\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-start] {\n    --shadow-y-start: 0 28px 24px -16px rgb(0 0 0 / 100%);\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-end] {\n    --shadow-y-end: 0 -28px 24px -16px rgb(0 0 0 / 100%);\n}\n";

export declare const Select: typeof Select_2.Root;

/**
 * Tri-state for a select-all action over a list of selectable values.
 *  - `none`: nothing selected
 *  - `some`: at least one but not all selected (indeterminate)
 *  - `all`:  every value selected
 */
export declare type SelectAllState = 'none' | 'some' | 'all';

export declare function SelectContent({ className, children, side, sideOffset, align, alignOffset, alignItemWithTrigger, ...props }: Select_2.Popup.Props & Pick<Select_2.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'alignItemWithTrigger'>): React_2.ReactElement;

export declare function SelectGroup({ className, ...props }: Select_2.Group.Props): React_2.ReactElement;

export declare function SelectGroupLabel({ className, ...props }: Select_2.GroupLabel.Props): React_2.ReactElement;

export declare function SelectItem({ className, children, ...props }: Select_2.Item.Props): React_2.ReactElement;

export declare function SelectSeparator({ className, ...props }: Select_2.Separator.Props): React_2.ReactElement;

export declare function SelectTrigger({ className, size, children, ...props }: Select_2.Trigger.Props & {
    size?: 'sm' | 'default';
}): React_2.ReactElement;

export declare function SelectTriggerIcon({ className, ...props }: React_2.ComponentProps<typeof ChevronDownIcon>): React_2.ReactElement;

export declare function SelectValue({ className, ...props }: Select_2.Value.Props): React_2.ReactElement;

export declare function Separator({ className, orientation, ...props }: Separator_2.Props): React_2.ReactElement;

declare type ShowScrollToButton = ScrollEdge | 'all' | ReadonlyArray<ScrollEdge>;

export declare function Skeleton({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function SkeletonText({ lines, className, minWidth, maxWidth }: SkeletonTextProps): React_2.ReactElement;

declare type SkeletonTextProps = {
    lines?: number;
    className?: string;
    minWidth?: number;
    maxWidth?: number;
};

export declare function Slider({ className, defaultValue, value, min, max, ...props }: Slider_2.Root.Props): React_2.ReactElement;

export declare function Spinner({ className, ...props }: React_2.ComponentProps<'svg'>): React_2.ReactElement;

declare type Sticky = 'left' | 'right';

export declare function Switch({ className, size, ...props }: Switch_2.Root.Props & {
    size?: 'sm' | 'default';
}): React_2.ReactElement;

export declare const Table: React_2.ForwardRefExoticComponent<Omit<TableProps, "ref"> & React_2.RefAttributes<HTMLTableElement>>;

export declare const TableBody: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>, "ref"> & React_2.RefAttributes<HTMLTableSectionElement>>;

export declare const TableCaption: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.HTMLAttributes<HTMLElement>, HTMLElement>, "ref"> & React_2.RefAttributes<HTMLTableCaptionElement>>;

export declare const TableCell: React_2.ForwardRefExoticComponent<Omit<React_2.ClassAttributes<HTMLTableDataCellElement> & React_2.TdHTMLAttributes<HTMLTableDataCellElement> & {
    sticky?: Sticky;
} & CellLayout, "ref"> & React_2.RefAttributes<HTMLTableCellElement>>;

export declare const TableEmpty: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement>, "ref"> & React_2.RefAttributes<HTMLTableCellElement>>;

export declare const TableFooter: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>, "ref"> & React_2.RefAttributes<HTMLTableSectionElement>>;

export declare const TableHead: React_2.ForwardRefExoticComponent<Omit<React_2.ClassAttributes<HTMLTableHeaderCellElement> & React_2.ThHTMLAttributes<HTMLTableHeaderCellElement> & {
    sticky?: Sticky;
} & CellLayout, "ref"> & React_2.RefAttributes<HTMLTableCellElement>>;

export declare const TableHeader: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>, "ref"> & React_2.RefAttributes<HTMLTableSectionElement>>;

declare type TableProps = React_2.ComponentProps<'table'> & {
    /**
     * `true` — header sticks within the table's own scroll viewport (needs a
     * bounded height). `'page'` — header sticks to document scroll instead; the
     * wrappers drop their scroll container so stickiness escapes to the page.
     * Offset it past fixed page chrome with `--quill-table-sticky-top`.
     */
    stickyHeader?: boolean | 'page';
    /**
     * Stretch the table to fill its container instead of sizing to content (so it
     * never scrolls horizontally). Pair with `expand` on a column to choose which
     * one soaks up the slack; otherwise the extra width spreads across columns.
     */
    fullWidth?: boolean;
    /**
     * Cell density. `'sm'` tightens the head/cell inline padding to `0.75rem`
     * (from `1rem`) so the table's edge columns line up with a `Card size="sm"`'s
     * `0.75rem` inline padding. Pair with `Card size="sm" flush`.
     */
    size?: 'default' | 'sm';
    /** Classes for the inner `<table>`. Size/scroll go on the container via `className`. */
    tableClassName?: string;
    /** Ref to the scrolling viewport — for scroll-to-row, virtualization, IntersectionObservers, etc. */
    viewportRef?: React_2.Ref<HTMLDivElement>;
};

export declare const TableRow: React_2.ForwardRefExoticComponent<Omit<React_2.DetailedHTMLProps<React_2.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>, "ref"> & React_2.RefAttributes<HTMLTableRowElement>>;

export declare function Tabs({ className, orientation, ...props }: Tabs_2.Root.Props): React_2.ReactElement;

export declare function TabsContent({ className, ...props }: Tabs_2.Panel.Props): React_2.ReactElement;

export declare function TabsList({ className, variant, ...props }: Tabs_2.List.Props & VariantProps<typeof tabsListVariants>): React_2.ReactElement;

declare const tabsListVariants: (props?: ({
    variant?: "line" | "default" | null | undefined;
} & ClassProp) | undefined) => string;

export declare function TabsTrigger({ className, ...props }: Tabs_2.Tab.Props): React_2.ReactElement;

declare function Text_2({ className, size, variant, weight, render, ...props }: useRender.ComponentProps<'p'> & VariantProps<typeof textVariants>): React_2.ReactElement;
export { Text_2 as Text }

export declare function Textarea({ className, ...props }: React_2.ComponentProps<'textarea'>): React_2.ReactElement;

export declare const textVariants: (props?: ({
    size?: "xxs" | "base" | "xs" | "sm" | "lg" | null | undefined;
    variant?: "default" | "destructive" | "muted" | null | undefined;
    weight?: "normal" | "medium" | "semibold" | null | undefined;
} & ClassProp) | undefined) => string;

export declare type Theme = 'dark' | 'light' | 'system';

export declare function ThemeProvider({ children, defaultTheme, storageKey, disableTransitionOnChange, ...props }: ThemeProviderProps): React_2.ReactElement;

declare type ThemeProviderProps = {
    children: React_2.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
    disableTransitionOnChange?: boolean;
};

declare type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

export declare function ThreadItem({ className, ...props }: React_2.ComponentProps<'article'>): React_2.ReactElement;

/**
 * One icon action: a Button wrapped in a Tooltip. `label` is both the accessible name
 * (`aria-label`) and the tooltip content — one source of truth, so the tooltip can never drift
 * from what screen readers announce. Forwards all Button props, including `render`
 * (`render={<a href="…" />}` for a link action), and its ref reaches the underlying button — so it
 * works as a `render` target itself (e.g. `DropdownMenuTrigger render={<ThreadItemAction …/>}`).
 * Inside {@link ThreadItemActions} it joins the toolbar's roving focus and the tooltip provider is
 * built in; anywhere else (e.g. a reactions row) it needs a `TooltipProvider` ancestor.
 */
export declare const ThreadItemAction: React_2.ForwardRefExoticComponent<Omit<ButtonProps_2 & VariantProps<(props?: ({
variant?: "link" | "default" | "primary" | "outline" | "destructive" | "link-muted" | null | undefined;
size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | null | undefined;
focusableWhenDisabled?: boolean | null | undefined;
left?: boolean | null | undefined;
inert?: boolean | null | undefined;
} & ClassProp) | undefined) => string> & {
    loading?: boolean;
} & {
    label: string;
    tooltipSide?: React_2.ComponentProps<typeof TooltipContent>["side"];
}, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

/**
 * Hover-revealed actions toolbar, anchored to the item's top end corner. A Base UI Toolbar, so it
 * is one tab stop with arrow-key roving focus between actions. Hidden with opacity (not
 * `display: none`) so it stays keyboard-reachable — focus reveals it via `:focus-within`. Carries
 * its own `TooltipProvider`, so {@link ThreadItemAction} tooltips work without app-root setup and
 * moving between adjacent actions shares the provider's warm-up delay.
 */
export declare function ThreadItemActions({ className, 'aria-label': ariaLabel, ...props }: Toolbar.Root.Props): React_2.ReactElement;

/**
 * Collapsible attachment (image/file preview) — a Base UI Collapsible, open by default. The
 * trigger carries the filename and a rotating chevron; keyboard/AT get `aria-expanded` for free.
 */
export declare function ThreadItemAttachment({ className, defaultOpen, ...props }: Collapsible_2.Root.Props): React_2.ReactElement;

export declare function ThreadItemAttachmentContent({ children, className, ...props }: Collapsible_2.Panel.Props): React_2.ReactElement;

/** Framed image preview. `alt` is required — describe the image (empty `alt=""` only if purely decorative). */
export declare function ThreadItemAttachmentImage({ className, alt, ...props }: React_2.ComponentProps<'img'> & {
    alt: string;
}): React_2.ReactElement;

/** Filename row that toggles the attachment preview. Children become the visible label. */
export declare function ThreadItemAttachmentTrigger({ children, className, ...props }: Collapsible_2.Trigger.Props): React_2.ReactElement;

/** Author name. Renders a `span` by default; pass `render={<button />}` to make it a profile trigger. */
export declare function ThreadItemAuthor({ className, render, ...props }: useRender.ComponentProps<'span'>): React_2.ReactElement;

export declare function ThreadItemBody({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function ThreadItemContent({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

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
export declare function ThreadItemGroup({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function ThreadItemGutter({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

export declare function ThreadItemHeader({ className, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

/** Inline link inside {@link ThreadItemBody} — primary color, underline on hover. */
export declare function ThreadItemLink({ className, render, ...props }: useRender.ComponentProps<'a'>): React_2.ReactElement;

/**
 * Inline @mention pill inside {@link ThreadItemBody}. Renders a `span` by default; pass
 * `render={<button type="button" />}` (or `<a />`) when clicking it should open a profile.
 */
export declare function ThreadItemMention({ className, render, ...props }: useRender.ComponentProps<'span'>): React_2.ReactElement;

/**
 * A reaction pill — a Base UI Toggle, so `pressed`/`onPressedChange` and `aria-pressed` come for
 * free. Give it an `aria-label` naming the emoji and count ("victory hand, 1 reaction"); wrap the
 * emoji glyph in {@link ThreadItemReactionEmoji} so it stays out of the accessible name.
 */
export declare const ThreadItemReaction: React_2.ForwardRefExoticComponent<Omit<Toggle_2.Props<string>, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

/** Decorative emoji glyph inside a reaction — hidden from the accessible name. */
export declare function ThreadItemReactionEmoji({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

export declare function ThreadItemReactions({ className, 'aria-label': ariaLabel, ...props }: React_2.ComponentProps<'div'>): React_2.ReactElement;

/**
 * Reply summary row — a Button (variant `default`: transparent at rest, fill on hover), stretched
 * to the content column. Opens the thread on click; pass `render={<a />}` for a link.
 */
export declare function ThreadItemReplies({ className, ...props }: ButtonProps): React_2.ReactElement;

export declare function ThreadItemRepliesLabel({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

export declare function ThreadItemRepliesMeta({ className, ...props }: React_2.ComponentProps<'span'>): React_2.ReactElement;

/** Semantic `<time>` — pass `dateTime` so assistive tech gets the machine-readable value. */
export declare function ThreadItemTimestamp({ className, ...props }: React_2.ComponentProps<'time'>): React_2.ReactElement;

export declare function toast(options: ToastOptions): string;

export declare namespace toast {
    var success: (options: Omit<ToastOptions, "type">) => string;
    var info: (options: Omit<ToastOptions, "type">) => string;
    var warning: (options: Omit<ToastOptions, "type">) => string;
    var error: (options: Omit<ToastOptions, "type">) => string;
    var loading: (options: Omit<ToastOptions, "type">) => string;
    var dismiss: (id: string) => void;
    var update: (id: string, options: ToastOptions) => void;
}

declare type ToastActionData = {
    action?: {
        label: string;
        onClick: () => void;
    };
};

export declare const ToastCard: React_2.ForwardRefExoticComponent<Omit<ToastCardProps, "ref"> & React_2.RefAttributes<HTMLDivElement>>;

declare type ToastCardAction = {
    label: string;
    onClick: () => void;
};

export declare type ToastCardProps = React_2.ComponentPropsWithRef<'div'> & {
    toastTitle?: React_2.ReactNode;
    toastDescription?: React_2.ReactNode;
    icon?: React_2.ReactNode;
    action?: ToastCardAction;
    onDismiss?: () => void;
    showGapHitArea?: boolean;
};

export declare const toastManager: ToastManager<ToastActionData>;

export declare type ToastOptions = {
    title?: string;
    description?: string;
    type?: ToastType;
    timeout?: number;
    onClose?: () => void;
    action?: {
        label: string;
        onClick: () => void;
    };
};

export declare function ToastProvider({ children, limit, timeout }: ToastProviderProps): React_2.ReactElement;

declare type ToastProviderProps = {
    children: React_2.ReactNode;
    limit?: number;
    timeout?: number;
};

export declare type ToastType = 'success' | 'info' | 'warning' | 'error' | 'loading';

export declare function Toggle({ className, variant, size, ...props }: Toggle_2.Props & VariantProps<typeof toggleVariants>): React_2.ReactElement;

export declare function ToggleGroup({ className, variant, size, spacing, orientation, children, ...props }: ToggleGroup_2.Props & VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: 'horizontal' | 'vertical';
}): React_2.ReactElement;

export declare function ToggleGroupItem({ className, children, variant, size, ...props }: Toggle_2.Props & VariantProps<typeof toggleVariants>): React_2.ReactElement;

export declare const toggleVariants: (props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "sm" | "lg" | "icon" | null | undefined;
} & ClassProp) | undefined) => string;

export declare function Tooltip({ ...props }: Tooltip_2.Root.Props): React_2.ReactElement;

export declare function TooltipContent({ className, side, sideOffset, align, alignOffset, children, ...props }: Tooltip_2.Popup.Props & Pick<Tooltip_2.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>): React_2.ReactElement;

export declare function TooltipProvider({ delay, ...props }: Tooltip_2.Provider.Props): React_2.ReactElement;

export declare function TooltipTrigger({ ...props }: Tooltip_2.Trigger.Props): React_2.ReactElement;

/**
 * Hook returning the anchor ref so consumers (e.g. an external trigger)
 * can position the popup against an arbitrary element.
 */
export declare function useAutocompleteAnchor(): React_2.RefObject<HTMLDivElement>;

export declare const useCalendar: ({ weekStartsOn, viewing: initialViewing, selected: initialSelected, numberOfMonths, }?: UseCalendarOptions) => UseCalendarReturn;

export declare interface UseCalendarOptions {
    weekStartsOn?: Day;
    viewing?: Date;
    selected?: Date[];
    numberOfMonths?: number;
}

export declare interface UseCalendarReturn {
    clearTime: (date: Date) => Date;
    inRange: (date: Date, min: Date, max: Date) => boolean;
    viewing: Date;
    setViewing: React.Dispatch<React.SetStateAction<Date>>;
    viewToday: () => void;
    viewMonth: (month: Month) => void;
    viewPreviousMonth: () => void;
    viewNextMonth: () => void;
    viewYear: (year: number) => void;
    viewPreviousYear: () => void;
    viewNextYear: () => void;
    selected: Date[];
    setSelected: React.Dispatch<React.SetStateAction<Date[]>>;
    clearSelected: () => void;
    isSelected: (date: Date) => boolean;
    select: (date: Date | Date[], replaceExisting?: boolean) => void;
    deselect: (date: Date | Date[]) => void;
    toggle: (date: Date, replaceExisting?: boolean) => void;
    selectRange: (start: Date, end: Date, replaceExisting?: boolean) => void;
    deselectRange: (start: Date, end: Date) => void;
    calendar: Date[][][];
}

export { useChatMessageScroller }

export { useChatMessageScrollerScrollable }

export { useChatMessageScrollerVisibility }

export declare function useComboboxAnchor(): React_2.RefObject<HTMLDivElement>;

export { useDirection }

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
export declare function useDropdownMenuSelectAll<T>(values: readonly T[], selected: readonly T[], onChange: (next: T[]) => void, getKey?: (value: T) => string | number): UseSelectAllResult;

export declare type UseSelectAllResult = {
    state: SelectAllState;
    isAllSelected: boolean;
    toggle: () => void;
};

export declare const useTheme: () => ThemeProviderState;

declare type VAlign = 'top' | 'middle' | 'bottom';

export { }
