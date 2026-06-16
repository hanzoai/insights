// @ts-nocheck
import { CyclotronJobInvocationInsightsFlow } from '~/cdp/types'
import { InsightsFlowAction } from '~/schema/insightsflow'

import { findNextAction } from '../insightsflow-utils'
import { ActionHandler, ActionHandlerOptions, ActionHandlerResult } from './action.interface'

type Action = Extract<InsightsFlowAction, { type: 'random_cohort_branch' }>

export class RandomCohortBranchHandler implements ActionHandler {
    execute({
        invocation,
        action,
    }: ActionHandlerOptions<Extract<InsightsFlowAction, { type: 'random_cohort_branch' }>>): ActionHandlerResult {
        const nextAction = getRandomCohort(invocation, action)
        return { nextAction, result: { assigned_cohort: nextAction.id } }
    }
}

export function getRandomCohort(invocation: CyclotronJobInvocationInsightsFlow, action: Action): InsightsFlowAction {
    const random = Math.random() * 100 // 0-100
    let cumulativePercentage = 0

    for (const [index, cohort] of action.config.cohorts.entries()) {
        cumulativePercentage += cohort.percentage
        if (random <= cumulativePercentage) {
            return findNextAction(invocation.insightsFlow, action.id, index)
        }
    }

    // If we somehow get here (shouldn't happen if percentages add up to 100),
    // go to the last cohort
    return findNextAction(invocation.insightsFlow, action.id, action.config.cohorts.length - 1)
}
