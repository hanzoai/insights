/**
 * Insights product taxonomy for the sandbox resources bar. Ported from the agent's
 * `POSTFN_PRODUCTS` (ids + labels are authoritative there) with icons sourced from
 * `@hanzo/icons` (plus the in-house SQL icon). The `_insights/resources_used` wire frame already carries `{id, label}`, so this
 * map is the icon source plus a fallback label for any id the wire omits. Labels are NOT a
 * mechanical sentence-casing of the id (e.g. `llm_analytics → "AI observability"`,
 * `cdp → "Data pipelines"`, acronyms stay all-caps), so they are copied verbatim.
 */
import { ComponentType } from 'react'

import {
    IconAI,
    IconCursor,
    IconDatabase,
    IconFlask,
    IconGraph,
    IconLogomark,
    IconMessage,
    IconPlug,
    IconPulse,
    IconRewind,
    IconServer,
    IconToggle,
    IconWarning,
} from '@hanzo/icons'

import { IconBracketsChart } from 'lib/elements/icons'

export type InsightsProductId =
    | 'product_analytics'
    | 'web_analytics'
    | 'feature_flags'
    | 'experiments'
    | 'error_tracking'
    | 'session_replay'
    | 'surveys'
    | 'llm_analytics'
    | 'data_warehouse'
    | 'cdp'
    | 'logs'
    | 'apm'
    | 'sql'
    | 'insights'

export interface InsightsProductMeta {
    label: string
    // wide enough for both @hanzo/icons components and elements Icons
    Icon: ComponentType<{ className?: string }>
}

export const POSTFN_PRODUCTS: Record<InsightsProductId, InsightsProductMeta> = {
    product_analytics: { label: 'Product analytics', Icon: IconGraph },
    web_analytics: { label: 'Web analytics', Icon: IconPulse },
    feature_flags: { label: 'Feature flags', Icon: IconToggle },
    experiments: { label: 'Experiments', Icon: IconFlask },
    error_tracking: { label: 'Error tracking', Icon: IconWarning },
    session_replay: { label: 'Session replay', Icon: IconRewind },
    surveys: { label: 'Surveys', Icon: IconMessage },
    llm_analytics: { label: 'AI observability', Icon: IconAI },
    data_warehouse: { label: 'Data warehouse', Icon: IconDatabase },
    cdp: { label: 'Data pipelines', Icon: IconPlug },
    logs: { label: 'Logs', Icon: IconServer },
    apm: { label: 'APM', Icon: IconCursor },
    sql: { label: 'SQL', Icon: IconBracketsChart },
    insights: { label: 'Insights', Icon: IconLogomark },
}

/** Fallback icon for ids absent from the taxonomy — degrade gracefully rather than disappearing. */
export const FALLBACK_PRODUCT_ICON = IconLogomark

/** Resolve a product id to its icon + display label, tolerating unknown ids (uses the wire label). */
export function resolveProductMeta(id: string, wireLabel?: string): InsightsProductMeta {
    const known = POSTFN_PRODUCTS[id as InsightsProductId]
    if (known) {
        return { label: wireLabel || known.label, Icon: known.Icon }
    }
    return { label: wireLabel || id, Icon: FALLBACK_PRODUCT_ICON }
}
