import { DateTime } from 'luxon'
import { Counter, Summary } from 'prom-client'

import { Flow, FlowAction } from '~/cdp/schema/flow'
import { CyclotronJobInvocationFlow, CyclotronJobInvocationResult, InsightsFunctionFilterGlobals } from '~/cdp/types'
import { execScript } from '~/cdp/utils/script-exec'
import { filterFunctionInstrumented } from '~/cdp/utils/script-function-filtering'
import { logger } from '~/common/utils/logger'
import { captureException } from '~/common/utils/insights'

// The run's position (or the edge it needs next) no longer exists in the flow's graph - the
// workflow was edited underneath an in-flight run. This is a user action, not a defect: the
// executor catches it and finishes the run as a graceful exit instead of a failure.
export class WorkflowChangedError extends Error {}

export const findActionById = (flow: Flow, id: string): FlowAction => {
    const action = flow.actions.find((action) => action.id === id)
    if (!action) {
        throw new WorkflowChangedError(`Action ${id} not found`)
    }

    return action
}

export const findActionByType = <T extends FlowAction['type']>(
    flow: Flow,
    type: T
): Extract<FlowAction, { type: T }> | undefined => {
    const action = flow.actions.find((action) => action.type === type)
    if (!action) {
        return undefined
    }

    return action as Extract<FlowAction, { type: T }>
}

export const findNextAction = (flow: Flow, currentActionId: string, edgeIndex?: number): FlowAction => {
    const edges = flow.edges.filter((edge) => edge.from === currentActionId)

    let nextActionId: string | undefined

    if (edgeIndex === undefined) {
        nextActionId = edges.find((edge) => edge.type === 'continue')?.to
    } else {
        nextActionId = edges.find((edge) => edge.type === 'branch' && edge.index === edgeIndex)?.to
    }

    if (!nextActionId) {
        throw new WorkflowChangedError(`No next action found for action ${currentActionId}`)
    }

    return findActionById(flow, nextActionId)
}

export function ensureCurrentAction(invocation: CyclotronJobInvocationFlow): FlowAction {
    // If we don't have a current action then we need to set it to the trigger action
    if (!invocation.state.currentAction) {
        const triggerAction = invocation.flow.actions.find((action) => action.type === 'trigger')
        if (!triggerAction) {
            throw new Error('No trigger action found')
        }

        // Set the current action to the trigger action
        invocation.state.currentAction = {
            id: triggerAction.id,
            startedAtTimestamp: DateTime.now().toMillis(),
        }

        const nextAction = findContinueAction(invocation)
        if (!nextAction) {
            throw new Error('No next action found')
        }

        invocation.state.currentAction = {
            id: nextAction.id,
            startedAtTimestamp: DateTime.now().toMillis(),
        }

        return nextAction
    }

    return findActionById(invocation.flow, invocation.state.currentAction.id)
}

export function findContinueAction(invocation: CyclotronJobInvocationFlow): FlowAction {
    const currentActionId = invocation.state.currentAction?.id
    if (!currentActionId) {
        throw new Error('Cannot find continue action without a current action')
    }

    return findNextAction(invocation.flow, currentActionId)
}

export async function shouldSkipAction(
    invocation: CyclotronJobInvocationFlow,
    action: FlowAction
): Promise<boolean> {
    if (!action.filters) {
        return false
    }

    const filterResults = await filterFunctionInstrumented({
        fn: invocation.flow,
        filters: action.filters,
        filterGlobals: invocation.filterGlobals,
    })

    return !filterResults.match
}

// Special format which the frontend understands and can render as a link
export const actionIdForLogging = (action: Pick<FlowAction, 'id'>): string => {
    return `[Action:${action.id}]`
}

// A wait condition that targets nothing compiles to always-true bytecode (Python's filter compiler
// returns `Constant(true)` for an empty filter), which would match on entry and wake the job on every
// event. We detect that structurally — the same way the compiler decides: a filter is empty when it
// has no properties, no events, no actions, and no test-account filtering. Checking the structure
// rather than the compiled bytecode is robust to bytecode/version changes (no need to enumerate the
// always-true forms) and keeps a real condition expressed through any of those fields evaluable.
export function isEvaluableCondition(condition?: {
    filters?: {
        properties?: unknown[]
        events?: unknown[]
        actions?: unknown[]
        filter_test_accounts?: boolean
    }
}): boolean {
    const filters = condition?.filters
    if (!filters) {
        return false
    }
    return (
        (filters.properties?.length ?? 0) > 0 ||
        (filters.events?.length ?? 0) > 0 ||
        (filters.actions?.length ?? 0) > 0 ||
        Boolean(filters.filter_test_accounts)
    )
}

const counterScriptflowFilterBytecodeError = new Counter({
    name: 'cdp_flow_matcher_bytecode_error',
    help: 'A wait_until_condition or conversion-goal filter threw during evaluation. Filter is treated as non-matching, so the workflow falls through to its timeout branch.',
})

// Logged as separate fields on a bytecode error so it's filterable by flow/action.
// actionId is absent for a conversion goal (not an action).
export type FlowBytecodeContext = { flowId: string; actionId?: string }

// An "events to wait for" / conversion entry that targets neither events nor actions compiles to
// always-true bytecode (the UI can leave an empty entry behind when the last event is removed), so
// it would match every incoming event. Action-based entries (events empty, actions set) are real
// and must be kept. Shared by the wait_until_condition and conversion evaluators so the rule lives
// in one place.
export function hasEventOrActionTarget(eventConfig: {
    filters?: { events?: unknown[]; actions?: unknown[] }
}): boolean {
    return Boolean(eventConfig.filters?.events?.length || eventConfig.filters?.actions?.length)
}

// Evaluates a compiled filter against the event. FlowSerializer compiles bytecode for
// every events[].filters at save time, so missing/empty bytecode means a malformed row:
// we fail closed (return false) rather than falling back to event-name-only matching, which
// would silently bypass property filters.
export async function runFilterBytecode(
    bytecode: unknown,
    filterGlobals: InsightsFunctionFilterGlobals,
    context: FlowBytecodeContext
): Promise<boolean> {
    if (!Array.isArray(bytecode) || bytecode.length === 0) {
        return false
    }
    try {
        const result = await execScript(bytecode, { globals: filterGlobals })
        return result.execResult?.result === true
    } catch (err) {
        // A broken filter silently never matches and the workflow falls through to its
        // timeout branch, which is usually the wrong outcome. Surface loudly so we notice.
        logger.error('🔴', 'Bytecode evaluation error', { ...context, err })
        captureException(err, { extra: { ...context } })
        counterScriptflowFilterBytecodeError.inc()
        return false
    }
}

// `events` and the property-based `condition` are OR'd: a step can wait on either,
// and either matching wakes the job. The condition is evaluated on every incoming
// event, which is what makes property-based waits event-driven rather than polled.
// Used by the subscription matcher in production and by the test-invocation endpoint
// to simulate a matcher wake against a supplied event.
export async function matchesWaitUntilCondition(
    action: Extract<FlowAction, { type: 'wait_until_condition' }>,
    filterGlobals: InsightsFunctionFilterGlobals,
    context: FlowBytecodeContext
): Promise<boolean> {
    for (const eventConfig of action.config.events ?? []) {
        if (!hasEventOrActionTarget(eventConfig)) {
            continue
        }
        if (await runFilterBytecode(eventConfig.filters?.bytecode, filterGlobals, context)) {
            return true
        }
    }
    // An empty condition compiles to always-true bytecode, which would wake the job on the next
    // event of any kind. Only evaluate the condition when it has a real compiled filter;
    // otherwise the wait relies on its `events` / the step timeout.
    if (!isEvaluableCondition(action.config.condition)) {
        return false
    }
    return runFilterBytecode(action.config.condition?.filters?.bytecode, filterGlobals, context)
}

const DELAY_ACTION_TYPES: FlowAction['type'][] = ['delay', 'wait_until_condition', 'wait_until_time_window']

export function hasDelayActions(actions: FlowAction[]): boolean {
    return actions.some((action) => DELAY_ACTION_TYPES.includes(action.type))
}

const workflowE2eLagMsSummary = new Summary({
    name: 'workflow_e2e_lag_ms',
    help: 'Time difference in ms between event capture time and workflow finishing time',
    percentiles: [0.5, 0.9, 0.95, 0.99],
})

/**
 * Intended to measure the time between when the event was captured and when the workflow finished.
 */
export function trackE2eLag(result: CyclotronJobInvocationResult<CyclotronJobInvocationFlow>): void {
    if (!result.finished) {
        return
    }

    const capturedAt = result.invocation.state.event?.captured_at
    // We're ignoring flows with delay actions for now because they're hard to track accurately (may or may not have run)
    const hasDelay = hasDelayActions(result.invocation.flow.actions)

    if (capturedAt && !hasDelay) {
        const e2eLagMs = Date.now() - new Date(capturedAt).getTime()
        workflowE2eLagMsSummary.observe(e2eLagMs)
    }
}
