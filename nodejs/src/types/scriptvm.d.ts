declare module '@posthog/scriptvm' {
    export interface VMState {
        [key: string]: any
    }

    export interface ExecOptions {
        timeout?: number
        globals?: Record<string, any>
        asyncFunctions?: Record<string, (...args: any[]) => Promise<any>>
        functions?: Record<string, (...args: any[]) => any>
        maxAsyncSteps?: number
        external?: Record<string, any>
    }

    export interface ExecResult {
        result: any
        finished: boolean
        error?: Error
        state: VMState
        asyncFunctionResponses?: any[]
        asyncFunctionArgs?: any[]
        asyncFunctionName?: string
    }

    export const DEFAULT_TIMEOUT_MS: number

    export function exec(bytecode: any[], options?: ExecOptions): ExecResult
    export function convertScriptToJS(script: any): string
}
