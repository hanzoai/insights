import { MessageScroller as MessageScrollerPrimitive, useMessageScroller, useMessageScrollerScrollable, useMessageScrollerVisibility } from '@shadcn/react/message-scroller';
import * as React from 'react';
/**
 * Thin quill wrapper over the headless `@shadcn/react/message-scroller` engine.
 *
 * Non-virtualized by design: rows stay in the DOM, kept cheap via `content-visibility: auto` +
 * `contain-intrinsic-size` (see {@link ChatMessageScrollerItem}). Stick-to-bottom, anchoring, and
 * preserve-on-prepend are imperative inside the engine and surfaced through `data-*` attributes —
 * no React state on scroll. Styling lives in `chat-message-scroller.css` (quill convention).
 */
declare function ChatMessageScrollerProvider(props: React.ComponentProps<typeof MessageScrollerPrimitive.Provider>): React.ReactElement;
declare function ChatMessageScroller({ className, ...props }: React.ComponentProps<typeof MessageScrollerPrimitive.Root>): React.ReactElement;
declare function ChatMessageScrollerViewport({ className, ...props }: React.ComponentProps<typeof MessageScrollerPrimitive.Viewport>): React.ReactElement;
type ChatMessageScrollerContentProps = React.ComponentProps<typeof MessageScrollerPrimitive.Content> & {
    /** Row spacing: `dense` 0.5rem, `default` 1rem, `loose` 1.5rem. */
    density?: 'dense' | 'default' | 'loose';
};
declare function ChatMessageScrollerContent({ className, density, ...props }: ChatMessageScrollerContentProps): React.ReactElement;
/**
 * One transcript row. `scrollAnchor` marks turn boundaries (the engine pins anchored rows near the
 * viewport top on new turns). Off-screen size estimate is tuned in `chat-message-scroller.css`.
 */
declare function ChatMessageScrollerItem({ className, scrollAnchor, ...props }: React.ComponentProps<typeof MessageScrollerPrimitive.Item>): React.ReactElement;
/**
 * Scroll-to-edge control. The engine toggles `data-active` from imperative scroll tracking;
 * visibility/animation is pure CSS off that attribute.
 */
declare function ChatMessageScrollerButton({ direction, className, children, render, ...props }: React.ComponentProps<typeof MessageScrollerPrimitive.Button>): React.ReactElement;
export { ChatMessageScrollerProvider, ChatMessageScroller, ChatMessageScrollerViewport, ChatMessageScrollerContent, ChatMessageScrollerItem, ChatMessageScrollerButton, useMessageScroller as useChatMessageScroller, useMessageScrollerScrollable as useChatMessageScrollerScrollable, useMessageScrollerVisibility as useChatMessageScrollerVisibility, };
