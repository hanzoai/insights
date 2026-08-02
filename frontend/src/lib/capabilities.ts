import { urls } from 'scenes/urls'

/**
 * What this build of Insights carries, and the honest thing to say where it doesn't.
 *
 * Everything listed here as unavailable was implemented in upstream's separately-licensed `ee/`
 * tree, which this fork does not ship. The endpoints behind them are absent, not failing: a
 * surface for one of these must not render a control and must never make a request.
 *
 * Two ways to read a capability. Where an entry point can simply go away (a nav item, a button),
 * check `available` and don't render it. Where someone can still land on the surface (a bookmark,
 * an open panel), render `<Unavailable capability="..." />` so the page explains itself instead of
 * sitting empty or erroring.
 *
 * The wording says what is true today: "coming soon" only where a replacement is genuinely being
 * built, and a plain absence everywhere else, because a promise nobody means to keep is worse than
 * a gap. When one ships, flip `available` here and every surface comes back with it.
 */
export type CapabilityKey = 'ai' | 'aiTools' | 'sessionSummaries' | 'subscriptions' | 'billing' | 'roles'

export interface Capability {
    /** Surfaces read this to decide whether to render at all. */
    available: boolean
    title: string
    body: string
    /** Somewhere useful to go instead. A thunk so this module doesn't call `urls` at import time. */
    link?: { to: () => string; label: string }
}

export const CAPABILITIES: Record<CapabilityKey, Capability> = {
    // The assistant is being rebuilt on Hanzo's own AI rather than dropped, so this one is a real
    // "soon". Flip it in the change that wires the client up; every entry point reads it.
    ai: {
        available: false,
        title: 'Insights AI is coming soon',
        body: "The assistant is moving onto Hanzo's own AI. It isn't available yet.",
    },
    // The per-product actions ("write this filter for me") are a different thing from the chat:
    // each one needed a tool running inside Insights, and those are gone for good. Upstream had
    // already deprecated them. Nothing renders this copy today; every entry point is removed.
    aiTools: {
        available: false,
        title: 'AI actions are not available',
        body: 'Insights AI cannot fill in filters, queries, or surveys for you. You can still build any of them by hand.',
    },
    sessionSummaries: {
        available: false,
        title: 'Session summaries are not available',
        body: 'Insights cannot summarize a recording for you. Recordings still record, play back, and filter as usual.',
        link: { to: () => urls.replay(), label: 'Go to session replay' },
    },
    subscriptions: {
        available: false,
        title: 'Subscriptions are not available',
        body: 'Insights cannot email or post a dashboard on a schedule. You can share a dashboard by link, or export it.',
    },
    billing: {
        available: false,
        title: 'Billing is not available',
        body: 'Insights does not handle plans or payment.',
    },
    roles: {
        available: false,
        title: 'Roles are not available',
        body: 'Access is granted per member and per project. Grouping members into roles is not part of Insights.',
        link: { to: () => urls.settings('organization-members'), label: 'Go to members' },
    },
}
