import * as React from 'react';
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
type ChatStreamProps = React.ComponentProps<'div'> & {
    /** Follow the newest content. Turn it off when the output stops and the reader takes over. */
    pinned?: boolean;
};
declare function ChatStream({ pinned, className, children, onScroll, ...props }: ChatStreamProps): React.ReactElement;
/** One line of output. Reveals itself as it arrives, while the stream is pinned. */
declare function ChatStreamLine({ className, ...props }: React.ComponentProps<'p'>): React.ReactElement;
export { ChatStream, ChatStreamLine };
