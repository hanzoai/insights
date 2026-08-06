import { Counter } from 'prom-client'

export const counterParseError = new Counter({
    name: 'cdp_function_parse_error',
    help: 'A function invocation was parsed with an error',
    labelNames: ['error'],
})

export const counterRateLimited = new Counter({
    name: 'cdp_function_rate_limited',
    help: 'A function invocation was rate limited',
    labelNames: ['kind', 'function_id'],
})

export const counterInsightsFunctionStateOnEvent = new Counter({
    name: 'cdp_insights_function_state_on_event',
    help: 'Metric the state of a script function that matched an event',
    labelNames: ['state', 'kind'],
})

export const counterBatchInsightsFlowTriggerFailed = new Counter({
    name: 'cdp_batch_hog_flow_trigger_failed',
    help: 'A batch script flow run failed during audience resolution and was skipped',
    labelNames: ['hog_flow_id', 'reason'],
})
