import { AI_AVAILABLE } from 'lib/constants'
import { urls } from 'scenes/urls'

/**
 * What this build of Insights carries, and the honest thing to say where it doesn't.
 *
 * Everything listed here as unavailable was implemented in upstream's separately-licensed `ee/`
 * tree, which this fork does not ship. Their endpoints are absent, not failing — `/subscriptions/`,
 * `/roles/`, `/session_summaries/` and `/conversations/` all answer 404 while a working endpoint
 * answers 401/403. So a surface for one of these must not fire a request and must not offer a
 * control that cannot work.
 *
 * Two ways to read a capability. Where an entry point can simply go away (a nav item, a button),
 * check `available` and don't render it. Where someone can still land on the surface — a bookmark,
 * a deep link, an open panel — render `<Unavailable capability="..." />` so the page explains
 * itself instead of sitting empty, erroring, or offering a dead control.
 *
 * The wording says only what is true today. None of these promises a date, because a promise
 * nobody is scheduled to keep is worse than a plain gap. When one genuinely ships, flip
 * `available` here and every surface that reads it comes back at once.
 */
export type CapabilityKey = 'ai' | 'sessionSummaries' | 'subscriptions' | 'roles' | 'approvals'

export interface Capability {
    /** Surfaces read this to decide whether to render, and loaders to decide whether to fetch. */
    available: boolean
    title: string
    body: string
    /** Somewhere useful to go instead. A thunk so this module doesn't call `urls` at import time. */
    link?: { to: () => string; label: string }
}

export const CAPABILITIES: Record<CapabilityKey, Capability> = {
    // Reads the flag the rest of the app already gates on, rather than introducing a second
    // switch that could disagree with it: `AI_AVAILABLE` hides every entry point, and this adds
    // the wording for the one place you can still land — the `/ai` scene itself, which stays
    // routed and so needs to say something rather than offer a chat box that goes nowhere.
    //
    // Why it is off, since the answer is not in this repository: api.hanzo.ai does accept a
    // hanzo.id JWT, but a user's Insights token is audience-bound to `hanzo-insights`, which the
    // gateway rejects on purpose, and IAM declines to exchange it ("client is not permitted for
    // token exchange"). Baking in an API key is not a way around it — a key belongs to exactly
    // one org and this image serves more than one. So this states a fact instead of promising a
    // date; permitting that one IAM client is what makes it true.
    ai: {
        available: AI_AVAILABLE,
        title: 'Insights AI is not available',
        body: 'This deployment does not run the assistant. Everything it could look up — insights, recordings, dashboards — is still there to explore directly.',
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
        body: 'Insights cannot email or post a dashboard on a schedule. You can still share a dashboard by link, or export it.',
    },
    roles: {
        available: false,
        title: 'Roles are not available',
        body: 'Access is granted per member and per project. Grouping members into roles is not part of Insights.',
        link: { to: () => urls.settings('organization-members'), label: 'Go to members' },
    },
    // Two settings panes and a routed scene, shown to every org admin, all reading endpoints that
    // answer 404. Approvals also drew its approver lists from roles, so it could not have worked
    // even if its own endpoints came back.
    approvals: {
        available: false,
        title: 'Approvals are not available',
        body: 'Changes apply as soon as they are made. Insights cannot hold one for review first. Every change is still recorded in the activity log.',
    },
}
