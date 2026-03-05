import { DateTime } from 'luxon'

import { CustomFlowAction } from '../../../../schema/customflow'
import { CyclotronJobInvocationCustomFlow, CyclotronJobInvocationResult } from '../../../types'
import { ScriptExecutorExecuteAsyncOptions } from '../../script-executor.service'

export interface ActionHandlerResult {
    nextAction?: CustomFlowAction
    scheduledAt?: DateTime
    finished?: boolean
    result?: unknown
    error?: any
}

export interface ActionHandlerOptions<T extends CustomFlowAction> {
    invocation: CyclotronJobInvocationCustomFlow
    action: T
    result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>
    scriptExecutorOptions?: ScriptExecutorExecuteAsyncOptions
}

export interface ActionHandler {
    execute(options: ActionHandlerOptions<CustomFlowAction>): ActionHandlerResult | Promise<ActionHandlerResult>
}
