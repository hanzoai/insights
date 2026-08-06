import * as React from 'react';
/**
 * Message row primitives, vendored from the shadcn `base-mira` registry and renamed `ChatX`.
 * Styling lives in `chat-message.css` (quill convention); `data-slot`/`data-align` attributes drive
 * the selectors. Avatar is optional.
 *
 * Anatomy:  ChatMessage > [ChatMessageAvatar] + ChatMessageContent > [Header] + Bubble + [Footer]
 */
declare function ChatMessageGroup({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function ChatMessage({ className, align, ...props }: React.ComponentProps<'div'> & {
    align?: 'start' | 'end';
}): React.ReactElement;
declare function ChatMessageAvatar({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function ChatMessageContent({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function ChatMessageHeader({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function ChatMessageFooter({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
export { ChatMessageGroup, ChatMessage, ChatMessageAvatar, ChatMessageContent, ChatMessageFooter, ChatMessageHeader, };
