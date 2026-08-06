import { useRender } from '@base-ui/react/use-render';
import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
/**
 * Bubble surface primitives, vendored from the shadcn `base-mira` registry and renamed `ChatX`.
 * Scoped to the bubble surface only — avatar/name/timestamps/actions live on {@link ./chat-message}.
 *
 * Styling lives in `chat-bubble.css` (quill convention). Variants are intentionally generic;
 * restyle per product. Assistant turns use `variant="ghost"` (transparent, full-width); user turns
 * use a filled variant.
 */
declare function ChatBubbleGroup({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare const bubbleVariants: (props?: ({
    variant?: "default" | "outline" | "destructive" | "secondary" | "muted" | "tinted" | "ghost" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function ChatBubble({ variant, align, className, ...props }: React.ComponentProps<'div'> & VariantProps<typeof bubbleVariants> & {
    align?: 'start' | 'end';
}): React.ReactElement;
declare function ChatBubbleContent({ className, render, ...props }: useRender.ComponentProps<'div'>): React.ReactElement;
declare function ChatBubbleReactions({ side, align, className, ...props }: React.ComponentProps<'div'> & {
    align?: 'start' | 'end';
    side?: 'top' | 'bottom';
}): React.ReactElement;
export { ChatBubbleGroup, ChatBubble, ChatBubbleContent, ChatBubbleReactions, bubbleVariants };
