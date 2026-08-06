import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import * as React from 'react';
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
type ChatTaskStatus = 'pending' | 'active' | 'done' | 'failed';
type ChatTaskListProps = React.ComponentProps<typeof CollapsiblePrimitive.Root> & {
    /** Steps finished so far. Drives the header icon and the count; never inferred from children. */
    value: number;
    /** Steps in the plan. */
    total: number;
};
declare function ChatTaskList({ value, total, className, ...props }: ChatTaskListProps): React.ReactElement;
declare function ChatTaskListTrigger({ className, children, ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>): React.ReactElement;
/**
 * The header's at-a-glance state: a list before anything starts, a ring that fills as steps land, a
 * check once they all have. Derived from `value`/`total`, so it can't drift from the count beside it.
 *
 * It doubles as the disclosure affordance: hovering or focusing the row swaps the state icon for a
 * chevron, the same trade `CollapsibleTrigger`'s `icon` prop makes. The state is what you want at
 * rest; the chevron only matters once you've reached for it, so it doesn't need to sit there
 * permanently taking up the row.
 */
declare function ChatTaskListProgress({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
declare function ChatTaskListLabel({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
/**
 * `2/5`, where each digit rolls to its successor. The rolling glyphs are decorative — the real value
 * goes to screen readers once, as text, instead of announcing a half-rolled pair.
 */
declare function ChatTaskListCount({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
declare function ChatTaskListContent({ className, children, ...props }: React.ComponentProps<'ol'>): React.ReactElement;
type ChatTaskProps = React.ComponentProps<'li'> & {
    status?: ChatTaskStatus;
    /** Clamp the label to one line with an ellipsis. Off by default — a long step wraps. */
    truncate?: boolean;
};
declare function ChatTask({ status, truncate, className, children, ...props }: ChatTaskProps): React.ReactElement;
/** What the step produced: a duration, an exit code, the line that explains a failure. */
declare function ChatTaskDetail({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
export { ChatTaskList, ChatTaskListTrigger, ChatTaskListProgress, ChatTaskListLabel, ChatTaskListCount, ChatTaskListContent, ChatTask, ChatTaskDetail, type ChatTaskStatus, };
