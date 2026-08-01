import type { ReactNode } from 'react'

import { IconBolt } from '@hanzo/icons'

import { getPermissionRequestToolInput, registerToolRenderers } from 'products/insights_ai/frontend/api/tools'
import type { PermissionRequestRecord } from 'products/insights_ai/frontend/api/types'

import { InsightsFunctionConfigDiff } from './InsightsFunctionConfigDiff'
import { buildInsightsFunctionConfigDiff } from './insightsFunctionConfigDiffUtils'
import { insightsFunctionConfigurationLogic } from './insightsFunctionConfigurationLogic'

/**
 * Approval-card preview for `cdp-functions-partial-update`: a diff of the agent's proposed update
 * against the script function the user has open. Reads the mounted `insightsFunctionConfigurationLogic` for the
 * live config; when the scene isn't mounted there's no current config to diff against, so it returns
 * null and the surface falls back to the raw JSON payload. `findAllMounted` (not `findMounted`) because
 * the logic is keyed by function id — the surface can't reconstruct the key — and the edit scene mounts
 * a single instance.
 */
function renderPartialUpdatePreview(record: PermissionRequestRecord): ReactNode | null {
    const mounted = insightsFunctionConfigurationLogic.findAllMounted()[0]
    const current = mounted?.values.configuration as Record<string, unknown> | undefined
    if (!current) {
        return null
    }
    const proposed = getPermissionRequestToolInput(record)
    // An update aimed at a different function than the one on screen must not render a diff against
    // the open form — that would preview the wrong change. Fall back to the raw payload.
    const targetId = typeof proposed.id === 'string' ? proposed.id : null
    const mountedId = typeof mounted.props.id === 'string' ? mounted.props.id : null
    if (targetId && mountedId && targetId !== mountedId) {
        return null
    }
    const diffs = buildInsightsFunctionConfigDiff(current, proposed)
    if (diffs.length === 0) {
        return null
    }
    return <InsightsFunctionConfigDiff diffs={diffs} />
}

// Register on module load (idempotent — re-registering the same key overwrites). A preview-only entry:
// no `Renderer`, so the tool-result card still resolves to the generic MCP card via `lookupToolRenderer`.
// cdp-functions-create is intentionally left to the default JSON payload (no current config to diff).
// `requiresInsightsOrigin`: an imported MCP server's tool with a colliding bare name must not have its
// approval payload dressed up as this first-party diff — untrusted calls keep the raw JSON payload.
registerToolRenderers([
    {
        key: 'cdp-functions-partial-update',
        displayName: 'Update function',
        icon: <IconBolt />,
        renderPermissionPreview: renderPartialUpdatePreview,
        requiresInsightsOrigin: true,
    },
])
