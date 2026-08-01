import { DateTime } from 'luxon'

import { InsightsFlowAction } from '~/cdp/schema/hogflow'

import { CyclotronJobInvocationInsightsFlow, CyclotronJobInvocationResult } from '../../../types'
import { HogExecutorExecuteAsyncOptions } from '../../script-executor.service'

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
    hogExecutorOptions?: HogExecutorExecuteAsyncOptions
}

export interface ActionHandler {
    execute(options: ActionHandlerOptions<InsightsFlowAction>): ActionHandlerResult | Promise<ActionHandlerResult>
}
