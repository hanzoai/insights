import { useRender } from '@base-ui/react/use-render';
import * as React from 'react';
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
type ChatSourceStatus = 'pending' | 'loading' | 'done';
declare function ChatSourceList({ className, ...props }: React.ComponentProps<'ul'>): React.ReactElement;
type ChatSourceProps = useRender.ComponentProps<'a'> & {
    status?: ChatSourceStatus;
    href?: string;
};
declare function ChatSource({ status, className, children, href, render, ...props }: ChatSourceProps): React.ReactElement;
declare function ChatSourceTitle({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
declare function ChatSourceUrl({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
export { ChatSourceList, ChatSource, ChatSourceTitle, ChatSourceUrl, type ChatSourceStatus };
