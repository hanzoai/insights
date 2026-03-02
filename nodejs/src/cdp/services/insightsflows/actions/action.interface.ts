import { DateTime } from 'luxon'

import { InsightsFlowAction } from '../../../../schema/customflow'
import { CyclotronJobInvocationInsightsFlow, CyclotronJobInvocationResult } from '../../../types'
import { ScriptExecutorExecuteAsyncOptions } from '../../script-executor.service'

export interface ActionHandlerResult {
    nextAction?: InsightsFlowAction
    scheduledAt?: DateTime
    finished?: boolean
    result?: unknown
    error?: any
}

export interface ActionHandlerOptions<T extends InsightsFlowAction> {
    invocation: CyclotronJobInvocationInsightsFlow
    action: T
    result: CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFlow>
    scriptExecutorOptions?: ScriptExecutorExecuteAsyncOptions
}

export interface ActionHandler {
    execute(options: ActionHandlerOptions<InsightsFlowAction>): ActionHandlerResult | Promise<ActionHandlerResult>
}
