import { filterFunctionInstrumented } from '~/cdp/utils/custom-function-filtering'
import { CustomFlowAction } from '~/schema/customflow'

import { findContinueAction } from '../customflow-utils'
import { ActionHandler, ActionHandlerOptions, ActionHandlerResult } from './action.interface'

// NOTE: This is not an actively used action as the triggering is done by the scheduler
// but useful for testing the customflow executor
export class TriggerHandler implements ActionHandler {
    async execute({
        invocation,
        action,
    }: ActionHandlerOptions<Extract<CustomFlowAction, { type: 'trigger' }>>): Promise<ActionHandlerResult> {
        if (action.config.type !== 'event') {
            return { nextAction: findContinueAction(invocation) }
        }

        const filterResults = await filterFunctionInstrumented({
            fn: invocation.customFlow,
            filters: action.config.filters,
            filterGlobals: invocation.filterGlobals,
        })

        if (filterResults.error) {
            throw new Error(filterResults.error as string)
        }

        if (!filterResults.match) {
            return { finished: true }
        }

        return { nextAction: findContinueAction(invocation) }
    }
}
