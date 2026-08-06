import { useRender } from '@base-ui/react/use-render';
import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
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
type ChatMarkerStatus = 'running' | 'done' | 'error';
declare const markerVariants: (props?: ({
    variant?: "separator" | "default" | "border" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
type ChatMarkerProps = useRender.ComponentProps<'div'> & VariantProps<typeof markerVariants> & {
    /**
     * Omit for a settled note. `running` shimmers the content, `error` turns the row destructive,
     * `done` keeps the value it acted on. The app flips it; the primitive never infers it.
     */
    status?: ChatMarkerStatus;
    /** Renders the marker as a collapsible: this becomes the expandable panel below the row. */
    body?: React.ReactNode;
    /** Uncontrolled initial open state (only meaningful with `body`). */
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};
declare function ChatMarker({ body, ...props }: ChatMarkerProps): React.ReactElement;
declare function ChatMarkerIcon({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
declare function ChatMarkerContent({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
/** The argument a call acted on — a query, a path, a command. Quoted, and kept once it settles. */
declare function ChatMarkerValue({ className, ...props }: React.ComponentProps<'span'>): React.ReactElement;
export { ChatMarker, ChatMarkerIcon, ChatMarkerContent, ChatMarkerValue, markerVariants, type ChatMarkerStatus };
