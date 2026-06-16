import { ScriptExecutorServiceHub } from './services/script-executor.service'
import {
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    InsightsFunctionInvocationGlobalsWithInputs,
    MinimalLogEntry,
} from './types'

export type AsyncFunctionContext = {
    invocation: CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>['invocation']
    globals: InsightsFunctionInvocationGlobalsWithInputs
    hub: ScriptExecutorServiceHub
}

export type AsyncFunctionHandler = {
    execute: (
        args: any[],
        context: AsyncFunctionContext,
        result: CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>
    ) => Promise<void> | void

    mock: (args: any[], logs: MinimalLogEntry[]) => any
}

const asyncFunctionHandlers = new Map<string, AsyncFunctionHandler>()

export function registerAsyncFunction(name: string, handler: AsyncFunctionHandler): void {
    if (asyncFunctionHandlers.has(name)) {
        throw new Error(`Async function '${name}' is already registered`)
    }
    asyncFunctionHandlers.set(name, handler)
}

export function getAsyncFunctionHandler(name: string): AsyncFunctionHandler | undefined {
    return asyncFunctionHandlers.get(name)
}

export function getRegisteredAsyncFunctionNames(): string[] {
    return Array.from(asyncFunctionHandlers.keys())
}
