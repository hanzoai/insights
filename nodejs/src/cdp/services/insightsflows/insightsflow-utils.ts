import { DateTime } from 'luxon'
import { Summary } from 'prom-client'

import { CyclotronJobInvocationInsightsFlow, CyclotronJobInvocationResult } from '~/cdp/types'
import { filterFunctionInstrumented } from '~/cdp/utils/insights-function-filtering'
import { InsightsFlow, InsightsFlowAction } from '~/schema/customflow'

export const findActionById = (insightsFlow: InsightsFlow, id: string): InsightsFlowAction => {
    const action = insightsFlow.actions.find((action) => action.id === id)
    if (!action) {
        throw new Error(`Action ${id} not found`)
    }

    return action
}

export const findActionByType = <T extends InsightsFlowAction['type']>(
    insightsFlow: InsightsFlow,
    type: T
): Extract<InsightsFlowAction, { type: T }> | undefined => {
    const action = insightsFlow.actions.find((action) => action.type === type)
    if (!action) {
        return undefined
    }

    return action as Extract<InsightsFlowAction, { type: T }>
}

export const findNextAction = (insightsFlow: InsightsFlow, currentActionId: string, edgeIndex?: number): InsightsFlowAction => {
    const edges = insightsFlow.edges.filter((edge) => edge.from === currentActionId)

    let nextActionId: string | undefined

    if (edgeIndex === undefined) {
        nextActionId = edges.find((edge) => edge.type === 'continue')?.to
    } else {
        nextActionId = edges.find((edge) => edge.type === 'branch' && edge.index === edgeIndex)?.to
    }

    if (!nextActionId) {
        throw new Error(`No next action found for action ${currentActionId}`)
    }

    return findActionById(insightsFlow, nextActionId)
}

export function ensureCurrentAction(invocation: CyclotronJobInvocationInsightsFlow): InsightsFlowAction {
    // If we don't have a current action then we need to set it to the trigger action
    if (!invocation.state.currentAction) {
        const triggerAction = invocation.insightsFlow.actions.find((action) => action.type === 'trigger')
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

    return findActionById(invocation.insightsFlow, invocation.state.currentAction.id)
}

export function findContinueAction(invocation: CyclotronJobInvocationInsightsFlow): InsightsFlowAction {
    const currentActionId = invocation.state.currentAction?.id
    if (!currentActionId) {
        throw new Error('Cannot find continue action without a current action')
    }

    return findNextAction(invocation.insightsFlow, currentActionId)
}

export async function shouldSkipAction(
    invocation: CyclotronJobInvocationInsightsFlow,
    action: InsightsFlowAction
): Promise<boolean> {
    if (!action.filters) {
        return false
    }

    const filterResults = await filterFunctionInstrumented({
        fn: invocation.insightsFlow,
        filters: action.filters,
        filterGlobals: invocation.filterGlobals,
    })

    return !filterResults.match
}

// Special format which the frontend understands and can render as a link
export const actionIdForLogging = (action: Pick<InsightsFlowAction, 'id'>): string => {
    return `[Action:${action.id}]`
}

const DELAY_ACTION_TYPES: InsightsFlowAction['type'][] = ['delay', 'wait_until_condition', 'wait_until_time_window']

export function hasDelayActions(actions: InsightsFlowAction[]): boolean {
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
export function trackE2eLag(result: CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFlow>): void {
    if (!result.finished) {
        return
    }

    const capturedAt = result.invocation.state.event?.captured_at
    // We're ignoring insightsflows with delay actions for now because they're hard to track accurately (may or may not have run)
    const hasDelay = hasDelayActions(result.invocation.insightsFlow.actions)

    if (capturedAt && !hasDelay) {
        const e2eLagMs = Date.now() - new Date(capturedAt).getTime()
        workflowE2eLagMsSummary.observe(e2eLagMs)
    }
}
