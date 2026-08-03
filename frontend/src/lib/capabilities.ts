import { urls } from 'scenes/urls'

/**
 * What this build of Insights carries, and the honest thing to say where it doesn't.
 *
 * Everything listed here as unavailable went with upstream's separately-licensed `ee/` tree, which
 * this fork does not ship. Mostly that means the endpoints are absent rather than failing —
 * `/subscriptions/`, `/roles/`, `/session_summaries/` and `/groups/` all answer 404 while a working
 * endpoint answers 401/403. So a surface for one of these must not fire a request and must not
 * offer a control that cannot work.
 *
 * The assistant used to be listed here and no longer is: `products/insights_ai` serves it natively.
 * Only the part that did not come back — its memory between conversations — is still described.
 *
 * Absent is not the only way to be unavailable, though, so check before assuming it: `approvals`
 * below answers 401 and is unavailable for a different reason entirely.
 *
 * This is about what the build carries, so it is the frontend half of one answer. The backend half
 * is `PRODUCT_FEATURES` in `insights/models/organization.py`, which lists the features that ARE
 * carried; a capability here should be absent from that list, and vice versa.
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
export type CapabilityKey = 'aiMemory' | 'sessionSummaries' | 'subscriptions' | 'roles' | 'approvals' | 'groups'

export interface Capability {
    /** Surfaces read this to decide whether to render, and loaders to decide whether to fetch. */
    available: boolean
    title: string
    body: string
    /** Somewhere useful to go instead. A thunk so this module doesn't call `urls` at import time. */
    link?: { to: () => string; label: string }
}

export const CAPABILITIES: Record<CapabilityKey, Capability> = {
    // The assistant itself IS available — `products/insights_ai` serves it, so there is no
    // `ai` entry here any more. What did not come with it is the memory: the assistant answers
    // from the current thread only, and nothing carries over to the next one. The settings
    // section that offers to edit those remembered details is the one surface that would
    // otherwise promise something no endpoint delivers, so it says this instead.
    aiMemory: {
        available: false,
        title: "Insights AI's memory is not available",
        body: 'The assistant does not retain anything between conversations, so there is nothing stored to review or edit here. Each conversation starts fresh, and everything you tell it within one is used for that conversation only.',
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
    // The exception to the paragraph above: approvals is the one entry here whose endpoints are
    // NOT absent. `change_requests` and `approval_policies` are registered on the environments
    // router and answer 401, and `PremiumFeaturePermission` only enforces on cloud, so they are
    // open. What left with `ee/` was the roles the policy pointed at, and the code that reads them
    // stayed: `ApprovalPolicy.bypass_roles` is gone from the model, yet `PolicyEngine.evaluate`
    // reads it on its first line and `ApprovalPolicySerializer` still declares a field for it. So a
    // policy raises the moment it is asked to hold a change — which is exactly when it matters.
    //
    // That makes this the one capability here that is a repair rather than a port: drop the role
    // pickers and the two reads, and approvals can be listed in `PRODUCT_FEATURES` and turned on.
    approvals: {
        available: false,
        title: 'Approvals are not available',
        body: 'Changes apply as soon as they are made. Insights cannot hold one for review first. Every change is still recorded in the activity log.',
    },
    // No groups viewset was ported: `/groups/`, `/groups_types/`, `/groups/find` and
    // `/groups/related` all answer 404, and no group type can be created. The upstream surface
    // treats this as an upsell — "Upgrade now", pointing at billing — which is wrong twice over
    // here, since there is no plan to buy and buying one would not add the endpoints.
    groups: {
        available: false,
        title: 'Group analytics is not available',
        body: 'Insights cannot roll users up into companies or accounts. Analysis is per user and per event, and every insight, cohort and recording works on that basis.',
    },
}
