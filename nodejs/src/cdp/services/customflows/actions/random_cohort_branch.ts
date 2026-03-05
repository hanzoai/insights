import { CyclotronJobInvocationCustomFlow } from '~/cdp/types'
import { CustomFlowAction } from '~/schema/customflow'

import { findNextAction } from '../customflow-utils'
import { ActionHandler, ActionHandlerOptions, ActionHandlerResult } from './action.interface'

type Action = Extract<CustomFlowAction, { type: 'random_cohort_branch' }>

export class RandomCohortBranchHandler implements ActionHandler {
    execute({
        invocation,
        action,
    }: ActionHandlerOptions<Extract<CustomFlowAction, { type: 'random_cohort_branch' }>>): ActionHandlerResult {
        const nextAction = getRandomCohort(invocation, action)
        return { nextAction, result: { assigned_cohort: nextAction.id } }
    }
}

export function getRandomCohort(invocation: CyclotronJobInvocationCustomFlow, action: Action): CustomFlowAction {
    const random = Math.random() * 100 // 0-100
    let cumulativePercentage = 0

    for (const [index, cohort] of action.config.cohorts.entries()) {
        cumulativePercentage += cohort.percentage
        if (random <= cumulativePercentage) {
            return findNextAction(invocation.customFlow, action.id, index)
        }
    }

    // If we somehow get here (shouldn't happen if percentages add up to 100),
    // go to the last cohort
    return findNextAction(invocation.customFlow, action.id, action.config.cohorts.length - 1)
}
