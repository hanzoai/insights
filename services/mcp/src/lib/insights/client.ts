import { InsightsMCP } from '@hanzo/mcp-analytics'

import { env } from '@/lib/env'

let _client: InsightsMCP | undefined

// `InsightsMCP` is a drop-in subclass of insights-node's `Insights` (capture /
// identify / flush / shutdown all inherited) that adds `captureToolCall` /
// `captureInitialize`. Using it for the shared client means every existing
// `.capture()` callsite keeps working while the hono analytics path gets the
// canonical `$mcp_*` event helpers.
export const getInsightsClient = (): InsightsMCP => {
    if (!_client) {
        _client = new InsightsMCP(env.POSTFN_ANALYTICS_API_KEY ?? '', {
            disabled: !env.POSTFN_ANALYTICS_API_KEY || !env.POSTFN_ANALYTICS_HOST, // Disable if the API key or host is not set
            ...(env.POSTFN_ANALYTICS_HOST ? { host: env.POSTFN_ANALYTICS_HOST } : {}),
            flushAt: 1,
            flushInterval: 0,
            // Tool errors already surface as `$mcp_is_error: true`; keep the SDK
            // from fanning out a separate `$exception` event into Error Tracking.
            enableExceptionAutocapture: false,
        })
    }

    return _client
}
