import { DateTime } from 'luxon'

import { FlowAction } from '~/cdp/schema/flow'

import { CyclotronJobInvocationFlow, CyclotronJobInvocationResult } from '../../../types'
import { ScriptExecutorExecuteAsyncOptions } from '../../script-executor-async.service'

export interface ActionHandlerResult {
    nextAction?: FlowAction
    scheduledAt?: DateTime
    finished?: boolean
    result?: unknown
    error?: any
}

export interface ActionHandlerOptions<T extends FlowAction> {
    invocation: CyclotronJobInvocationFlow
    action: T
    result: CyclotronJobInvocationResult<CyclotronJobInvocationFlow>
    scriptExecutorOptions?: ScriptExecutorExecuteAsyncOptions
}

export interface ActionHandler {
    execute(options: ActionHandlerOptions<FlowAction>): ActionHandlerResult | Promise<ActionHandlerResult>
}
